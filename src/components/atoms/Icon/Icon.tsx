import React from 'react';
import {
  Bell,
  VideoCamera,
  ClockCounterClockwise,
  Plus,
  MagnifyingGlass,
  SquaresFour,
  UserCircle,
  User,
  Lock,
  Key,
  Archive,
  Book,
  SignOut,
  X,
  CaretDown,
  Hash,
  ArrowClockwise,
  House,
  Briefcase,
  Users,
  Buildings,
  FileText,
  CaretUp,
  Minus,
  CaretLeft,
  CaretRight,
  CaretDoubleLeft,
  CaretDoubleRight,
  CaretDoubleUp,
  CaretDoubleDown,
  Funnel,
  Sliders,
  Download,
  FloppyDisk,
  Trash,
  Star,
  Heart,
  LinkedinLogo,
  PencilSimple,
  Pencil,
  Info,
  ChartBar,
  MapPin,
  Phone,
  Envelope,
  Calendar,
  Eye,
  Spinner,
  Check,
  Flag,
  Upload,
  Globe,
  Monitor,
  Paperclip,
  Link,
  ChatCircle,
  Rows,
  BookmarkSimple,
  CheckSquare,
  Warning,
  LinkBreak,
} from 'phosphor-react';

export type IconName =
  | 'bell'
  | 'video'
  | 'history'
  | 'plus'
  | 'search'
  | 'grid'
  | 'user-circle'
  | 'user'
  | 'lock'
  | 'key'
  | 'archive'
  | 'menu'
  | 'book'
  | 'sign-out'
  | 'close'
  | 'x'
  | 'caret-up'
  | 'caret-down'
  | 'caret-left'
  | 'caret-right'
  | 'caret-double-left'
  | 'caret-double-right'
  | 'caret-double-up'
  | 'caret-double-down'
  | 'home'
  | 'briefcase'
  | 'users'
  | 'buildings'
  | 'minus'
  | 'file-text'
  | 'funnel'
  | 'sliders'
  | 'download'
  | 'trash'
  | 'save'
  | 'star'
  | 'heart'
  | 'linkedin'
  | 'pencil'
  | 'edit'
  | 'info'
  | 'chart'
  | 'map-pin'
  | 'call'
  | 'mail'
  | 'eye'
  | 'calendar'
  | 'loading'
  | 'check'
  | 'upload'
  | 'alert'
  | 'award'
  | 'flag'
  | 'globe'
  | 'monitor'
  | 'file'
  | 'monitor'
  | 'attachment' 
  | 'external-link' 
  | 'chat'
  | 'rows'
  | 'hash' 
  | 'filter' 
  | 'refresh'
  | 'bookmark'
  | 'phone'
  | 'envelope'
  | 'check-square'
  | 'warning'
  | 'unmap'
  | 'alert-circle';

export interface IconProps {
  name: IconName;
  size?: number | string;
  color?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  className?: string;
  onClick?: () => void;
  'aria-label'?: string;
}

const iconMap = {
  bell: Bell,
  video: VideoCamera,
  history: ClockCounterClockwise,
  plus: Plus,
  search: MagnifyingGlass,
  grid: SquaresFour,
  'user-circle': UserCircle,
  user: User,
  lock: Lock,
  key: Key,
  archive: Archive,
  book: Book,
  'sign-out': SignOut,
  close: X,
  x: X,
  'caret-down': CaretDown,
  'caret-up': CaretUp,
  'caret-left': CaretLeft,
  'caret-right': CaretRight,
  'caret-double-left': CaretDoubleLeft,
  'caret-double-right': CaretDoubleRight,
  'caret-double-up': CaretDoubleUp,
  'caret-double-down': CaretDoubleDown,
  home: House,
  briefcase: Briefcase,
  users: Users,
  buildings: Buildings,
  minus: Minus,
  'file-text': FileText,
  funnel: Funnel,
  sliders: Sliders,
  download: Download,
  trash: Trash,
  save: FloppyDisk,
  star: Star,
  heart: Heart,
  linkedin: LinkedinLogo,
  pencil: PencilSimple,
  edit: Pencil,
  info: Info,
  chart: ChartBar,
  'map-pin': MapPin,
  call: Phone,
  mail: Envelope,
  eye: Eye,
  calendar: Calendar,
  loading: Spinner,
  check: Check,
  flag: Flag,
  upload: Upload,
  alert: Info,
  'alert-circle': Warning,
  award: Buildings,
  globe: Globe,
  monitor: Monitor,
  file: FileText,
  attachment: Paperclip,
  'external-link': Link,
  menu: Rows,
  rows: Rows,
  chat: ChatCircle,
  hash: Hash,
  filter: Funnel,
  refresh: ArrowClockwise,
  bookmark: BookmarkSimple,
  phone: Phone,
  envelope: Envelope,
  'check-square': CheckSquare,
  warning: Warning,
  unmap: LinkBreak,
};

const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color,
  weight = 'regular',
  className = '',
  onClick,
  'aria-label': ariaLabel,
}) => {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  const baseClasses = onClick
    ? 'cursor-pointer hover:opacity-75 transition-opacity'
    : '';

  return (
    <IconComponent
      size={size}
      color={color}
      weight={weight}
      className={`${baseClasses} ${className}`}
      onClick={onClick}
      aria-label={ariaLabel}
    />
  );
};

export default Icon;
