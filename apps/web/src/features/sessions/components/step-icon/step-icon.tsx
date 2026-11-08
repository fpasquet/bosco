import {
  BotIcon,
  CircleXIcon,
  FilePenIcon,
  FileTextIcon,
  FlaskConicalIcon,
  GlobeIcon,
  ListTodoIcon,
  LoaderCircleIcon,
  SearchIcon,
  TerminalIcon,
  WrenchIcon,
} from 'lucide-react';
import type { StepIcon as StepIconName, StepStatus } from '../../lib/conversation';

const ICONS = {
  edit: FilePenIcon,
  file: FileTextIcon,
  plan: ListTodoIcon,
  search: SearchIcon,
  subagent: BotIcon,
  terminal: TerminalIcon,
  tests: FlaskConicalIcon,
  tool: WrenchIcon,
  web: GlobeIcon,
};

/** Icône d'une étape : celle de l'outil, un rond qui tourne tant qu'il tourne, une croix s'il a échoué. */
export function StepIcon({ icon, status }: { icon: StepIconName; status: StepStatus }) {
  if (status === 'running') return <LoaderCircleIcon className="animate-spin motion-reduce:animate-none" />;
  if (status === 'error') return <CircleXIcon />;
  const Icon = ICONS[icon];
  return <Icon />;
}
