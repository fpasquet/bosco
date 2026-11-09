'use client';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { Plus } from 'lucide-react';
import { type CSSProperties, useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { useForm, useFormState, useWatch } from 'react-hook-form';
import type { PilotImageDto, PilotSettingsDto, SuggestionDto } from '@bosco/domain';
import { useIsPhone } from '@/shared/hooks/use-is-phone';
import { ComposerController } from './composer-controller';
import { ComposerHelp } from './composer-help';
import { ImageChip } from './image-chip';
import { IMAGE_TYPES, readImages } from './images';
import { textOf } from './mentions';
import { SendButton, type SendMode } from './send-button';
import { SettingsBar } from './settings-bar';
import { listIdOf, optionIdOf, SuggestionMenu } from './suggestion-menu';

export interface ComposerValue {
  images: PilotImageDto[];
  text: string;
}

export interface ComposerProps {
  autoFocus?: boolean;
  /** Zone désactivée (question de l'agent en attente) : rien ne s'écrit, boutons désactivés, aide masquée */
  disabled?: boolean;
  /** Libellé accessible du champ */
  label: string;
  /** Hauteur de départ en lignes (1 par défaut, 4 pour une nouvelle session) */
  minRows?: number;
  onSettingsChange: (settings: PilotSettingsDto) => void;
  onStop?: () => void;
  /** Entrée ou bouton d'envoi ; le composer se vide quand la promesse se résout, et garde le contenu si elle échoue */
  onSubmit: (value: ComposerValue) => Promise<void>;
  placeholder: string;
  /** Un tour tourne : champ vide → le bouton rond devient « Arrêter » (icône square) et appelle onStop */
  running?: boolean;
  /** Réglages du tour : mode d'autorisations, modèle, effort (barre d'outils) */
  settings: PilotSettingsDto;
  /** Bouton d'envoi libellé (« Démarrer ») au lieu du bouton rond à flèche */
  submitLabel?: string;
  /** Suggestions de « @ » (fichiers) et « / » (commandes et skills), appelées à chaque frappe après le déclencheur */
  suggest: (kind: 'command' | 'file', query: string) => Promise<SuggestionDto[]>;
}

interface Attachment {
  id: string;
  image: PilotImageDto;
}

function sendModeOf(running: boolean, empty: boolean, submitLabel: string | undefined): SendMode {
  if (running && empty) return 'stop';
  return submitLabel ? 'labeled' : 'send';
}

/** Pose ou retire un attribut d'accessibilité du champ, que Tiptap rend hors de React. */
function setAttribute(element: HTMLElement, name: string, value: null | string): void {
  if (value === null) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

function hasFiles(event: DragEvent): boolean {
  return !!event.dataTransfer?.types.includes('Files');
}

/**
 * Zone de message d'une session pilotée : éditeur (texte, sauts de ligne, puces de fichiers et de commandes), images
 * jointes, réglages du tour et bouton d'envoi. Le message sort en texte simple.
 */
export function Composer({
  autoFocus = false,
  disabled = false,
  label,
  minRows = 1,
  onSettingsChange,
  onStop,
  onSubmit,
  placeholder,
  running = false,
  settings,
  submitLabel,
  suggest,
}: ComposerProps) {
  const baseId = useId();
  const helpId = `${baseId}-help`;
  const phone = useIsPhone();
  const fileInput = useRef<HTMLInputElement>(null);
  const zone = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<null | string>(null);
  // Vue de l'éditeur rattachée au DOM : ses attributs ne se posent qu'ensuite
  const [mounted, setMounted] = useState(false);
  const [controller] = useState(() => new ComposerController());
  const { control, getValues, handleSubmit, setValue } = useForm<{ attachments: Attachment[] }>({
    defaultValues: { attachments: [] },
  });
  const attachments = useWatch({ control, name: 'attachments' });
  const { isSubmitting } = useFormState({ control });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: controller.extensions,
    editorProps: controller.editorProps,
    editable: !disabled,
    autofocus: autoFocus && !disabled ? 'end' : false,
    onMount: () => setMounted(true),
    onUnmount: () => setMounted(false),
  });
  const hasText = useEditorState({ editor, selector: ({ editor: current }) => !!current && textOf(current) !== '' });
  const menu = useSyncExternalStore(controller.subscribe, controller.getMenu, () => null);
  const empty = !hasText && attachments.length === 0;

  const addFiles = async (files: File[]) => {
    const reading = await readImages(files, getValues('attachments').length);
    const added = reading.images.map((image) => ({ id: crypto.randomUUID(), image }));
    setValue('attachments', [...getValues('attachments'), ...added]);
    setError(reading.error);
  };

  const submit = handleSubmit(async (values) => {
    if (!editor || disabled) return;
    const value: ComposerValue = { images: values.attachments.map(({ image }) => image), text: textOf(editor) };
    if (!value.text && value.images.length === 0) return;
    // En cas d'échec, le contenu reste : le parent affiche l'erreur
    const sent = await onSubmit(value).then(
      () => true,
      () => false,
    );
    if (!sent) return;
    editor.commands.clearContent(true);
    setValue('attachments', []);
    setError(null);
  });

  // Tiptap relit ces gestionnaires à chaque événement : toujours les props du dernier rendu
  useEffect(() => {
    controller.update({
      placeholder,
      suggest,
      onEnter: () => {
        if (!isSubmitting) void submit();
      },
      onFiles: (files) => {
        if (!disabled) void addFiles(files);
      },
    });
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  // Le texte indicatif est une décoration : une transaction vide la redessine
  useEffect(() => {
    if (editor && mounted) editor.view.dispatch(editor.state.tr.setMeta('addToHistory', false));
  }, [editor, mounted, placeholder]);

  // Combobox : le champ annonce le menu ouvert et l'option active (aria-activedescendant)
  const listed = !!menu && menu.items.length > 0;
  useEffect(() => {
    if (!editor || !mounted) return;
    const field = editor.view.dom;
    setAttribute(field, 'aria-label', label);
    setAttribute(field, 'aria-expanded', menu ? 'true' : 'false');
    setAttribute(field, 'aria-controls', listed ? listIdOf(baseId) : null);
    setAttribute(field, 'aria-activedescendant', listed && menu ? optionIdOf(baseId, menu.activeIndex) : null);
    setAttribute(field, 'aria-disabled', disabled ? 'true' : null);
    setAttribute(field, 'aria-describedby', disabled ? null : helpId);
  }, [baseId, disabled, editor, helpId, label, listed, menu, mounted]);

  // Image glissée hors de l'éditeur (barre d'outils, puces) ; dans l'éditeur, Tiptap l'a déjà prise
  useEffect(() => {
    const element = zone.current;
    if (!element || disabled) return;
    const onDragOver = (event: DragEvent) => {
      if (hasFiles(event)) event.preventDefault();
    };
    const onDrop = (event: DragEvent) => {
      if (event.defaultPrevented || !hasFiles(event)) return;
      event.preventDefault();
      controller.dropFiles(Array.from(event.dataTransfer?.files ?? []));
    };
    element.addEventListener('dragover', onDragOver);
    element.addEventListener('drop', onDrop);
    return () => {
      element.removeEventListener('dragover', onDragOver);
      element.removeEventListener('drop', onDrop);
    };
  }, [controller, disabled]);

  const removeAt = (id: string) =>
    setValue(
      'attachments',
      getValues('attachments').filter((attachment) => attachment.id !== id),
    );
  const mode = sendModeOf(running, empty, submitLabel);
  const rows = { '--composer-rows': minRows } as CSSProperties;

  return (
    <div ref={zone} className="relative flex flex-col gap-2">
      {menu && (
        <SuggestionMenu
          baseId={baseId}
          menu={menu}
          mount={controller.mount}
          phone={phone}
          onChoose={controller.choose}
        />
      )}
      <div
        className={`composer-card rounded-card border border-line shadow-card ${disabled ? 'bg-surface-alt' : 'bg-surface'}`}
      >
        <SettingsBar
          compact
          className="flex gap-1.5 overflow-x-auto px-2 pt-2 md:hidden"
          settings={settings}
          disabled={disabled}
          onChange={onSettingsChange}
        />
        {attachments.length > 0 && (
          <ul aria-label="Images jointes" className="flex flex-wrap gap-2 px-3 pt-3">
            {attachments.map(({ id, image }) => (
              <li key={id} className="max-w-full">
                <ImageChip image={image} disabled={disabled} onRemove={() => removeAt(id)} />
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-end gap-2 p-1.5 md:gap-1 md:px-2 md:pt-0 md:pb-2">
          <button
            type="button"
            aria-label="Joindre une image"
            disabled={disabled}
            className="btn btn-circle btn-outline btn-sm max-md:size-9"
            onClick={() => fileInput.current?.click()}
          >
            <Plus aria-hidden className="size-4" />
          </button>
          <SettingsBar
            className="flex items-center gap-1 max-md:hidden"
            settings={settings}
            disabled={disabled}
            onChange={onSettingsChange}
          />
          <EditorContent
            editor={editor}
            style={rows}
            className="composer-field min-w-0 flex-1 md:order-first md:basis-full"
          />
          <SendButton
            className="md:ml-auto"
            mode={mode}
            label={submitLabel}
            busy={isSubmitting}
            disabled={disabled || (mode === 'stop' ? !onStop : empty || isSubmitting)}
            onSend={() => void submit()}
            onStop={() => onStop?.()}
          />
        </div>
        <input
          ref={fileInput}
          type="file"
          accept={IMAGE_TYPES.join(',')}
          multiple
          hidden
          tabIndex={-1}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = '';
            if (files.length) void addFiles(files);
          }}
        />
      </div>
      <p aria-live="polite" className="px-1 text-xs text-danger empty:hidden">
        {error}
      </p>
      {!disabled && <ComposerHelp id={helpId} className="px-1 text-xs text-muted max-md:hidden" />}
    </div>
  );
}
