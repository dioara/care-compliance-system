# CCMS Icon Reference Guide

This document provides a comprehensive reference for icon usage across the Care Compliance Management System (CCMS). Following these guidelines ensures visual consistency throughout the application.

## Icon Library

The CCMS application uses **Phosphor Icons** as the primary icon library. Phosphor Icons was chosen for its comprehensive set of icons, consistent design language, and support for multiple weights.

**Package:** `@phosphor-icons/react`  
**Documentation:** https://phosphoricons.com/

## Icon Weight Standard

All Phosphor Icons in the CCMS application should use the **`bold`** weight for consistency. This provides better visibility and a more substantial appearance that aligns with the application's professional aesthetic.

```tsx
// Correct usage
<Warning className="h-4 w-4" weight="bold" />

// Incorrect - missing weight
<Warning className="h-4 w-4" />
```

## Icon Size Guidelines

Icons should follow these standard sizes based on their context:

| Context | Size Class | Pixel Size | Usage |
|---------|------------|------------|-------|
| Inline with text | `h-3 w-3` | 12px | Badge icons, small indicators |
| Button icons | `h-4 w-4` | 16px | Button labels, table actions |
| Card headers | `h-5 w-5` | 20px | Section titles, card headers |
| Page headers | `h-8 w-8` | 32px | Main page titles |
| Empty states | `h-12 w-12` | 48px | Empty state illustrations |

## Icon Mapping Reference

The following table maps common concepts to their corresponding Phosphor Icons:

### Navigation & Actions

| Concept | Phosphor Icon | Import |
|---------|---------------|--------|
| Dashboard | `House` | `import { House } from "@phosphor-icons/react"` |
| Settings | `Gear` | `import { Gear } from "@phosphor-icons/react"` |
| Search | `MagnifyingGlass` | `import { MagnifyingGlass } from "@phosphor-icons/react"` |
| Filter | `Funnel` | `import { Funnel } from "@phosphor-icons/react"` |
| Add/Create | `Plus` | `import { Plus } from "@phosphor-icons/react"` |
| Edit | `PencilSimple` | `import { PencilSimple } from "@phosphor-icons/react"` |
| Delete | `Trash` | `import { Trash } from "@phosphor-icons/react"` |
| Download | `DownloadSimple` | `import { DownloadSimple } from "@phosphor-icons/react"` |
| Upload | `UploadSimple` | `import { UploadSimple } from "@phosphor-icons/react"` |
| External link | `ArrowSquareOut` | `import { ArrowSquareOut } from "@phosphor-icons/react"` |
| Back/Previous | `CaretLeft` | `import { CaretLeft } from "@phosphor-icons/react"` |
| Next | `CaretRight` | `import { CaretRight } from "@phosphor-icons/react"` |

### Status & Feedback

| Concept | Phosphor Icon | Import |
|---------|---------------|--------|
| Success | `CheckCircle` | `import { CheckCircle } from "@phosphor-icons/react"` |
| Error | `XCircle` | `import { XCircle } from "@phosphor-icons/react"` |
| Warning | `Warning` | `import { Warning } from "@phosphor-icons/react"` |
| Info | `Info` | `import { Info } from "@phosphor-icons/react"` |
| Alert | `WarningCircle` | `import { WarningCircle } from "@phosphor-icons/react"` |
| Clock/Time | `Clock` | `import { Clock } from "@phosphor-icons/react"` |
| Calendar | `CalendarBlank` | `import { CalendarBlank } from "@phosphor-icons/react"` |

### Domain-Specific Icons

| Concept | Phosphor Icon | Import |
|---------|---------------|--------|
| Incidents | `Warning` | `import { Warning } from "@phosphor-icons/react"` |
| Audits | `ClipboardText` | `import { ClipboardText } from "@phosphor-icons/react"` |
| Staff | `UserCheck` | `import { UserCheck } from "@phosphor-icons/react"` |
| Service Users | `Users` | `import { Users } from "@phosphor-icons/react"` |
| Locations | `MapPin` | `import { MapPin } from "@phosphor-icons/react"` |
| Buildings | `Buildings` | `import { Buildings } from "@phosphor-icons/react"` |
| Compliance | `ClipboardCheck` | `import { ClipboardCheck } from "@phosphor-icons/react"` |
| Reports | `FileText` | `import { FileText } from "@phosphor-icons/react"` |
| AI Features | `Brain` | `import { Brain } from "@phosphor-icons/react"` |
| Security | `Shield` | `import { Shield } from "@phosphor-icons/react"` |
| Email | `Envelope` | `import { Envelope } from "@phosphor-icons/react"` |
| Notifications | `Bell` | `import { Bell } from "@phosphor-icons/react"` |
| Subscription | `CreditCard` | `import { CreditCard } from "@phosphor-icons/react"` |
| License | `Ticket` | `import { Ticket } from "@phosphor-icons/react"` |
| Key/API | `Key` | `import { Key } from "@phosphor-icons/react"` |

### Charts & Analytics

| Concept | Phosphor Icon | Import |
|---------|---------------|--------|
| Bar Chart | `ChartBar` | `import { ChartBar } from "@phosphor-icons/react"` |
| Pie Chart | `ChartPie` | `import { ChartPie } from "@phosphor-icons/react"` |
| Line Chart | `ChartLine` | `import { ChartLine } from "@phosphor-icons/react"` |
| Trend Up | `TrendUp` | `import { TrendUp } from "@phosphor-icons/react"` |
| Trend Down | `TrendDown` | `import { TrendDown } from "@phosphor-icons/react"` |

### User Management

| Concept | Phosphor Icon | Import |
|---------|---------------|--------|
| User | `User` | `import { User } from "@phosphor-icons/react"` |
| Users | `Users` | `import { Users } from "@phosphor-icons/react"` |
| User Add | `UserPlus` | `import { UserPlus } from "@phosphor-icons/react"` |
| User Remove | `UserMinus` | `import { UserMinus } from "@phosphor-icons/react"` |
| User Check | `UserCheck` | `import { UserCheck } from "@phosphor-icons/react"` |
| User Settings | `UserGear` | `import { UserGear } from "@phosphor-icons/react"` |
| Admin | `Crown` | `import { Crown } from "@phosphor-icons/react"` |
| Role | `Shield` | `import { Shield } from "@phosphor-icons/react"` |

## Usage Examples

### Page Header

```tsx
import { Warning } from "@phosphor-icons/react";

<div className="flex items-center gap-2">
  <Warning className="h-8 w-8" weight="bold" />
  <h1 className="text-2xl font-bold">Incidents</h1>
</div>
```

### Button with Icon

```tsx
import { Plus } from "@phosphor-icons/react";

<Button>
  <Plus className="h-4 w-4 mr-2" weight="bold" />
  Add New
</Button>
```

### Status Badge

```tsx
import { CheckCircle } from "@phosphor-icons/react";

<Badge className="bg-green-500">
  <CheckCircle className="h-3 w-3 mr-1" weight="bold" />
  Active
</Badge>
```

### Empty State

```tsx
import { FileText } from "@phosphor-icons/react";

<div className="text-center py-12">
  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" weight="bold" />
  <p className="text-muted-foreground">No documents found</p>
</div>
```

## Migration Notes

When migrating from Lucide React to Phosphor Icons, use the following mapping:

| Lucide Icon | Phosphor Equivalent |
|-------------|---------------------|
| `AlertTriangle` | `Warning` |
| `AlertCircle` | `WarningCircle` |
| `CheckCircle2` | `CheckCircle` |
| `Upload` | `UploadSimple` |
| `Download` | `DownloadSimple` |
| `ExternalLink` | `ArrowSquareOut` |
| `Mail` | `Envelope` |
| `Pencil` | `PencilSimple` |
| `Trash2` | `Trash` |
| `Building` / `Building2` | `Buildings` |
| `ChevronLeft` | `CaretLeft` |
| `ChevronRight` | `CaretRight` |
| `CalendarIcon` | `CalendarBlank` |
| `Search` | `MagnifyingGlass` |
| `Filter` | `Funnel` |
| `RefreshCw` | `ArrowsClockwise` |
| `ArrowUpDown` | `ArrowsDownUp` |
| `TrendingUp` | `TrendUp` |
| `TrendingDown` | `TrendDown` |
| `EyeOff` | `EyeSlash` |
| `UserCog` | `UserGear` |
| `ShieldAlert` | `ShieldWarning` |
| `BarChart3` | `ChartBar` |
| `PieChart` | `ChartPie` |
| `LineChart` | `ChartLine` |
| `Award` | `Medal` |

## Loader Icons

For loading states, continue using Lucide's `Loader2` as it provides the spinning animation:

```tsx
import { Loader2 } from "lucide-react";

<Loader2 className="h-4 w-4 animate-spin" />
```

## Best Practices

1. **Always specify weight**: Include `weight="bold"` on all Phosphor icons for consistency.

2. **Use semantic sizing**: Choose icon sizes based on context, not arbitrary values.

3. **Maintain spacing**: Use consistent margin classes (`mr-2`, `ml-2`) when icons appear next to text.

4. **Colour inheritance**: Icons inherit text colour by default. Use `text-*` classes to override when needed.

5. **Accessibility**: Icons used alone should have `aria-label` or be wrapped in a visually hidden label.

6. **Import efficiency**: Import only the icons you need rather than the entire library.

```tsx
// Good - named imports
import { Warning, CheckCircle, Clock } from "@phosphor-icons/react";

// Avoid - importing everything
import * as PhosphorIcons from "@phosphor-icons/react";
```

## Contributing

When adding new icons to the application:

1. Check if an appropriate icon exists in Phosphor Icons first
2. Follow the naming conventions in this guide
3. Use the `bold` weight consistently
4. Update this reference guide with any new icon mappings
5. Ensure the icon is semantically appropriate for its use case

---

*Last updated: December 2024*
