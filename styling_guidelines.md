# Abundance Projects - Styling Guidelines

## Color System

### Primary Colors
- **Primary**: `hsl(221.2 83.2% 53.3%)` - Main brand color for CTAs and links
- **Primary Foreground**: `hsl(210 40% 98%)` - Text on primary backgrounds

### Background Colors
- **Background**: `hsl(0 0% 100%)` - Main page background (white)
- **Foreground**: `hsl(222.2 84% 4.9%)` - Main text color (dark gray/black)

### Secondary Colors
- **Secondary**: `hsl(210 40% 96%)` - Light gray backgrounds
- **Secondary Foreground**: `hsl(222.2 84% 4.9%)` - Text on secondary backgrounds

### Muted Colors
- **Muted**: `hsl(210 40% 96%)` - Subtle backgrounds
- **Muted Foreground**: `hsl(215.4 16.3% 46.9%)` - Secondary text, captions

### Utility Colors
- **Border**: `hsl(214.3 31.8% 91.4%)` - Default border color
- **Input**: `hsl(214.3 31.8% 91.4%)` - Input field borders

## Typography

### Headings
- **H1**: `text-4xl font-bold tracking-tight` - Page titles
- **H2**: `text-3xl font-semibold` - Section titles
- **H3**: `text-2xl font-semibold` - Card titles
- **H4**: `text-xl font-medium` - Subsection titles

### Body Text
- **Base**: `text-base` (16px) - Primary body text
- **Small**: `text-sm` (14px) - Secondary text, captions
- **Large**: `text-lg` (18px) - Emphasized content

### Font Weights
- **Normal**: `font-normal` (400)
- **Medium**: `font-medium` (500) - Labels, important text
- **Semibold**: `font-semibold` (600) - Headings
- **Bold**: `font-bold` (700) - Page titles

## Spacing

### Component Spacing
- **Form Elements**: `space-y-6` - Consistent form field spacing
- **Card Content**: `p-6` - Standard card padding
- **Button Height**: `h-11` - Consistent button height
- **Input Height**: `h-11` - Matching input height

### Layout Spacing
- **Page Padding**: `px-4` - Minimum side padding
- **Section Gap**: `space-y-8` - Between major sections
- **Element Gap**: `space-y-4` - Between related elements

## Components

### Buttons
- **Primary**: Default variant with primary colors
- **Height**: `h-11` for consistency
- **Text**: `text-base font-medium`
- **Full Width**: `w-full` for forms

### Cards
- **Shadow**: `shadow-lg` for depth
- **Border**: `border-border` using design tokens
- **Header**: `space-y-2` for title and subtitle

### Form Elements
- **Labels**: `text-sm font-medium text-foreground`
- **Inputs**: `h-11` height, proper spacing
- **Form Groups**: `space-y-2` between label and input

### Links
- **Color**: `text-primary`
- **Hover**: `hover:text-primary/80`
- **Transition**: `transition-colors`

## Layout Patterns

### Authentication Pages
- **Container**: `min-h-screen flex items-center justify-center bg-background`
- **Form Width**: `max-w-md w-full`
- **Page Spacing**: `space-y-8`

### Content Pages
- **Main Container**: Use design system backgrounds
- **Content Width**: Responsive max-width containers
- **Consistent Padding**: Apply uniform spacing

## Implementation Rules

1. **Always use design tokens** instead of arbitrary colors
2. **Maintain consistent spacing** using the defined scale
3. **Apply proper typography hierarchy** with defined classes
4. **Use semantic color names** (primary, muted, etc.)
5. **Ensure proper contrast** between text and backgrounds
6. **Implement hover states** with appropriate transitions
7. **Maintain component consistency** across all pages