const fs = require('fs');
const path = require('path');

const iconMap = {
  'ArrowBackIos': 'ChevronLeft',
  'Notifications': 'Bell',
  'NotificationsActive': 'BellRing',
  'CalendarToday': 'Calendar',
  'MoreVert': 'MoreVertical',
  'School': 'GraduationCap',
  'People': 'Users',
  'AccountBalanceWallet': 'Wallet',
  'Timeline': 'TrendingUp',
  'AccessTime': 'Clock',
  'EventAvailable': 'CalendarCheck',
  'DirectionsBus': 'Bus',
  'Chat': 'MessageCircle',
  'Description': 'FileText',
  'MenuBook': 'BookOpen',
  'Functions': 'Calculator',
  'Science': 'FlaskConical',
  'LocationOn': 'MapPin',
  'LocalLibrary': 'Library',
  'SportsBasketball': 'Activity',
  'Computer': 'Monitor',
  'LocalDining': 'Utensils',
  'Call': 'Phone',
  'Email': 'Mail',
  'VerifiedUser': 'BadgeCheck',
  'BugReport': 'Bug',
  'Security': 'Shield',
  'DataUsage': 'Database',
  'CloudSync': 'CloudRain',
  'Dns': 'Server',
  'ReceiptLong': 'Receipt',
  'MoneyOff': 'Banknote',
  'AttachMoney': 'CircleDollarSign',
  'CheckCircle': 'CheckCircle2',
  'Cancel': 'XCircle',
  'Add': 'Plus',
  'AddCircle': 'PlusCircle',
  'Edit': 'Pencil',
  'DeleteOutline': 'Trash2',
  'HowToReg': 'UserCheck',
  'EmojiEvents': 'Trophy',
  'Group': 'Users',
  'Person': 'User',
  'Calculate': 'Calculator',
  'PersonSearch': 'UserSearch',
  'Assignment': 'ClipboardList',
  'Schedule': 'Clock',
  'UploadFile': 'Upload',
  'EventNote': 'CalendarDays',
  'PendingActions': 'Clock',
  'EventBusy': 'CalendarX',
  'FilterList': 'Filter',
  'Videocam': 'Video',
  'AttachFile': 'Paperclip',
  'Translate': 'Languages',
  'SwapHoriz': 'ArrowRightLeft',
  'Settings': 'Settings',
  'Search': 'Search',
  'Menu': 'Menu',
  'ChevronRight': 'ChevronRight',
  'TrendingDown': 'TrendingDown',
  'TrendingUp': 'TrendingUp',
  'Palette': 'Palette',
  'Payments': 'Banknote',
  'CalendarMonth': 'Calendar',
  'Campaign': 'Megaphone',
  'RecordVoiceOver': 'Mic',
  'Close': 'X',
  'ArrowForward': 'ArrowRight',
  'ContactSupport': 'HelpCircle',
  'ExpandMore': 'ChevronDown',
  'Grade': 'Star',
  'Event': 'Calendar',
  'Warning': 'AlertTriangle',
  'HistoryEdu': 'History',
  'ChatBubble': 'MessageCircle',
  'GridView': 'LayoutGrid',
  'Insights': 'LineChart',
  'MeetingRoom': 'DoorOpen',
  'FactCheck': 'ListChecks',
  'HelpOutline': 'HelpCircle',
  'ShowChart': 'LineChart',
  'DateRange': 'CalendarDays',
  'AutoStories': 'BookOpen',
  'Savings': 'PiggyBank',
  'AccountBalance': 'Landmark'
};

const dirs = [
  path.join(__dirname, 'screens/super_admin'),
  path.join(__dirname, 'screens/admin_staff'),
  path.join(__dirname, 'screens/teachers'),
  path.join(__dirname, 'screens/parents'),
  path.join(__dirname, 'screens/guest')
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Replace import statement icons
  const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]lucide-react-native['"];/g;
  content = content.replace(importRegex, (match, p1) => {
    let icons = p1.split(',').map(i => i.trim()).filter(i => i);
    let newIcons = new Set();
    icons.forEach(i => {
      newIcons.add(iconMap[i] || i);
    });
    return `import { ${Array.from(newIcons).join(', ')} } from 'lucide-react-native';`;
  });

  // Replace component usages (whole word replacement)
  for (const [oldIcon, newIcon] of Object.entries(iconMap)) {
    if (oldIcon !== newIcon) {
      const regex = new RegExp(`\\b${oldIcon}\\b`, 'g');
      content = content.replace(regex, newIcon);
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

dirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(file => {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        processFile(path.join(dir, file));
      }
    });
  }
});

console.log('Done fixing icons.');
