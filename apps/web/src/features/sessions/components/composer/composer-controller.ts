import type { EditorView } from '@tiptap/pm/view';
import type {
  SuggestionKeyDownProps,
  SuggestionMount,
  SuggestionOptions,
  SuggestionPositionData,
  SuggestionProps,
} from '@tiptap/suggestion';
import { shift } from '@floating-ui/dom';
import { Extension, type Extensions } from '@tiptap/core';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import Mention, { type MentionNodeAttrs } from '@tiptap/extension-mention';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { Placeholder, UndoRedo } from '@tiptap/extensions';
import { PluginKey } from '@tiptap/pm/state';
import { ReactNodeViewRenderer } from '@tiptap/react';
import type { SuggestionDto } from '@bosco/domain';
import { MentionChip } from './mention-chip';
import { mentionText, type SuggestionKind, TRIGGER } from './mentions';

/** Menu de suggestions ouvert : ce qu'il affiche et l'option active au clavier. */
export interface SuggestionMenuState {
  activeIndex: number;
  items: SuggestionDto[];
  kind: SuggestionKind;
  loading: boolean;
  /** Numéro de l'ouverture : change à chaque nouveau menu, pas à chaque frappe */
  openId: number;
  query: string;
}

/** Ce que le composant fournit à l'éditeur, relu à chaque événement (les props les plus récentes). */
export interface ComposerHandlers {
  onEnter: () => void;
  onFiles: (files: File[]) => void;
  placeholder: string;
  suggest: (kind: SuggestionKind, query: string) => Promise<SuggestionDto[]>;
}

type MentionCommand = (attrs: MentionNodeAttrs) => void;
type MentionSuggestion = Omit<SuggestionOptions<SuggestionDto, MentionNodeAttrs>, 'editor'>;

const NOOP_HANDLERS: ComposerHandlers = {
  onEnter: () => undefined,
  onFiles: () => undefined,
  placeholder: '',
  suggest: () => Promise.resolve([]),
};

/** Entrée envoie ; Maj+Entrée reste le saut de ligne de HardBreak. Rien ne coupe le paragraphe. */
const SubmitOnEnter = Extension.create<{ onEnter: () => void }>({
  name: 'submitOnEnter',
  addOptions: () => ({ onEnter: () => undefined }),
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        this.options.onEnter();
        return true;
      },
    };
  },
});

/** Puce rendue par React, pour les icônes de lucide. */
const MentionWithChip = Mention.extend({
  addNodeView: () => ReactNodeViewRenderer(MentionChip, { as: 'span' }),
});

/**
 * Pont entre Tiptap, créé une fois, et le composant : extensions stables, menu de suggestions exposé comme un magasin
 * (useSyncExternalStore), gestionnaires remplacés à chaque rendu. Les requêtes dépassées sont annulées par
 * @tiptap/suggestion : une réponse d'une frappe ancienne n'atteint jamais le menu.
 */
export class ComposerController {
  readonly editorProps = {
    attributes: {
      class: 'composer-editor',
      role: 'combobox',
      'aria-autocomplete': 'list',
      'aria-haspopup': 'listbox',
    },
    handleDrop: (_view: EditorView, event: DragEvent) => this.takeFiles(event.dataTransfer),
    handlePaste: (_view: EditorView, event: ClipboardEvent) => {
      // Un texte copié depuis un traitement de texte peut porter une image de lui-même : le texte l'emporte
      if (event.clipboardData?.getData('text/plain')) return false;
      return this.takeFiles(event.clipboardData);
    },
  };
  readonly extensions: Extensions;

  private command: MentionCommand | null = null;
  private handlers: ComposerHandlers = NOOP_HANDLERS;
  private readonly listeners = new Set<() => void>();
  private menu: null | SuggestionMenuState = null;
  private mountMenu: null | SuggestionMount = null;
  private opened = 0;

  constructor() {
    this.extensions = [
      Document,
      Paragraph,
      Text,
      HardBreak,
      UndoRedo,
      Placeholder.configure({ placeholder: () => this.handlers.placeholder, showOnlyWhenEditable: false }),
      MentionWithChip.configure({
        deleteTriggerWithBackspace: true,
        renderText: ({ node }) => this.textOfMention(node.attrs as MentionNodeAttrs),
        renderHTML: ({ node, options }) => [
          'span',
          options.HTMLAttributes,
          this.textOfMention(node.attrs as MentionNodeAttrs),
        ],
        suggestions: [this.suggestion('file'), this.suggestion('command')],
      }),
      SubmitOnEnter.configure({ onEnter: () => this.handlers.onEnter() }),
    ];
  }

  /** Insère l'option choisie (clic, Entrée ou Tab) comme une puce. */
  choose = (index: number): void => {
    const item = this.menu?.items[index];
    if (item && this.command) this.command({ id: item.value, label: null });
  };

  /** Fichiers glissés sur la zone, hors de l'éditeur. */
  dropFiles = (files: File[]): void => {
    if (files.length) this.handlers.onFiles(files);
  };

  getMenu = (): null | SuggestionMenuState => this.menu;

  /** Accroche le menu au curseur (Floating UI, par @tiptap/suggestion) et le ferme au clic en dehors. */
  mount = (element: HTMLElement, onPosition: (data: SuggestionPositionData) => void): (() => void) =>
    this.mountMenu?.(element, { onPosition }) ?? (() => undefined);

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  update(handlers: ComposerHandlers): void {
    this.handlers = handlers;
  }

  private onKeyDown({ event }: SuggestionKeyDownProps): boolean {
    const menu = this.menu;
    if (!menu) return false;
    const count = menu.items.length;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!count) return false;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      this.publish({ ...menu, activeIndex: (menu.activeIndex + step + count) % count });
      return true;
    }
    const inserts = event.key === 'Tab' || (event.key === 'Enter' && !event.shiftKey);
    if (!inserts) return false;
    if (count) {
      this.choose(menu.activeIndex);
      return true;
    }
    // Sans option, Entrée envoie le message, sauf pendant que les suggestions arrivent
    return event.key === 'Enter' && menu.loading;
  }

  private onStart(kind: SuggestionKind, props: SuggestionProps<SuggestionDto, MentionNodeAttrs>): void {
    this.command = props.command;
    this.mountMenu = props.mount;
    this.opened += 1;
    this.publish({ activeIndex: 0, items: [], kind, loading: props.loading, openId: this.opened, query: props.query });
  }

  private onUpdate(props: SuggestionProps<SuggestionDto, MentionNodeAttrs>): void {
    const menu = this.menu;
    if (!menu) return;
    this.command = props.command;
    // Pendant une requête, les options précédentes restent affichées : le menu ne clignote pas à chaque frappe
    if (props.loading) this.publish({ ...menu, loading: true, query: props.query });
    else this.publish({ ...menu, activeIndex: 0, items: props.items, loading: false, query: props.query });
  }

  private publish(menu: null | SuggestionMenuState): void {
    this.menu = menu;
    for (const listener of this.listeners) listener();
  }

  private suggestion(kind: SuggestionKind): MentionSuggestion {
    const char = TRIGGER[kind];
    const options: MentionSuggestion = {
      char,
      pluginKey: new PluginKey(`composer-${kind}`),
      placement: 'top-start',
      floatingUi: { strategy: 'fixed', middleware: [shift({ padding: 8 })] },
      items: ({ query }) => this.handlers.suggest(kind, query),
      render: () => ({
        onStart: (props) => this.onStart(kind, props),
        onUpdate: (props) => this.onUpdate(props),
        onExit: () => {
          this.command = null;
          this.mountMenu = null;
          this.publish(null);
        },
        onKeyDown: (props) => this.onKeyDown(props),
      }),
    };
    // « / » seulement en tête de message : position 1, le début du premier paragraphe
    if (kind === 'command') return { ...options, startOfLine: true, allow: ({ range }) => range.from === 1 };
    return options;
  }

  private takeFiles(data: DataTransfer | null): boolean {
    const files = Array.from(data?.files ?? []);
    if (!files.length) return false;
    this.handlers.onFiles(files);
    return true;
  }

  private textOfMention(attrs: MentionNodeAttrs): string {
    return mentionText(attrs.mentionSuggestionChar ?? TRIGGER.file, attrs.id ?? '');
  }
}
