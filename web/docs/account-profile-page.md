# Account/Profile Page Documentation

## Overview

The Account/Profile page (`/account`) provides users with a modern, clean interface to view their account information, wallet details, and connection status. The page features a responsive design with improved visual hierarchy and accessibility.

## Location

- **Page**: `web/src/app/account/page.tsx`
- **Components**: `web/src/components/account/`
- **Tests**: `web/src/components/account/__tests__/`

## Features

### Profile Header

The `ProfileHeader` component displays:
- **Circular Avatar**: Large circular avatar (20x20 on mobile, 28x28 on desktop) with:
  - Initials generated from user email
  - Gradient background (purple to blue)
  - Accessible alt text
  - Ring border for visual emphasis
- **User Name**: Extracted from email address
- **Status Message**: Dynamic status based on wallet connection state
- **Loading State**: Skeleton loader while fetching user data

### Profile Details

The `ProfileDetails` component displays user information in card format:
- **Public Key**: Stellar wallet public key (copyable, monospace font)
- **User ID**: Supabase user ID (copyable, monospace font)
- **Email**: User email address (copyable)
- **Network**: Current Stellar network (testnet/mainnet)
- **Connected Wallets**: Count of connected wallets
- **Last Sync**: Timestamp of last wallet synchronization
- **Account Created**: User account creation date
- **Connection Status**: Current connection state

All cards feature:
- Hover effects for better interactivity
- Copy-to-clipboard functionality for sensitive data
- Responsive grid layout (1 column mobile, 2 columns desktop)
- Consistent typography using Geist Sans and Geist Mono fonts

### Notification Banner

The `NotificationBanner` component provides:
- **Dismissible Notifications**: Users can dismiss banners
- **localStorage Persistence**: Dismiss state persists across sessions
- **Multiple Types**: Support for info, success, and warning styles
- **Customizable Storage Key**: Allows multiple banners with different keys
- **Accessible**: Proper ARIA roles and labels

## Design System

### Colors
- **Background**: `#0A0B1E` (dark blue-black)
- **Cards**: `bg-gray-800` with `border-gray-700`
- **Accent**: Purple (`purple-500`, `purple-400`) for actions
- **Text**: White for headings, gray-400 for secondary text

### Typography
- **Sans**: Geist Sans (`font-sans`) for body text
- **Mono**: Geist Mono (`font-mono`) for code-like data (public keys, IDs)

### Spacing
- Consistent use of Tailwind spacing utilities
- Responsive padding and margins
- Grid gaps for card layouts

### Responsive Design
- Mobile-first approach
- Avatar sizes: `w-20 h-20` (mobile) → `md:w-28 md:h-28` (desktop)
- Grid layout: 1 column (mobile) → 2 columns (desktop)
- Text sizes scale appropriately

## Component Architecture

### ProfileHeader

```typescript
interface ProfileHeaderProps {
  statusMessage?: string;
}
```

**Features:**
- Fetches user data from Supabase
- Generates initials from email
- Displays loading state
- Responsive avatar sizing

### ProfileDetails

```typescript
// No props - uses wallet store and Supabase directly
```

**Features:**
- Fetches user data from Supabase
- Reads wallet state from Zustand store
- Displays information in card grid
- Copy-to-clipboard functionality

### NotificationBanner

```typescript
interface NotificationBannerProps {
  message: string;
  type?: "info" | "success" | "warning";
  storageKey?: string;
}
```

**Features:**
- Checks localStorage for dismiss state
- Persists dismiss state
- Supports multiple banner types
- Accessible dismiss button

## Usage

### Basic Implementation

The account page is automatically available at `/account` route. It uses the app's RootLayout and integrates with existing wallet and authentication systems.

### Customization

#### Custom Status Message

```tsx
<ProfileHeader statusMessage="Custom welcome message" />
```

#### Custom Notification Banner

```tsx
<NotificationBanner
  message="Custom notification"
  type="info"
  storageKey="custom-banner-key"
/>
```

## Testing

All components have comprehensive unit tests:

- **ProfileHeader Tests**: User data loading, initials generation, status messages, accessibility
- **ProfileDetails Tests**: Data display, copy functionality, loading states, responsive behavior
- **NotificationBanner Tests**: Dismiss functionality, localStorage persistence, type styling, accessibility

Run tests with:
```bash
npm test
```

## Accessibility

- **Semantic HTML**: Uses `<header>`, `<main>`, `<section>` elements
- **ARIA Labels**: Proper labels for interactive elements
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Reader Support**: Alt text for avatars, descriptive labels
- **Color Contrast**: Meets WCAG AA standards

## Performance

- **Lazy Loading**: User data fetched on component mount
- **Memoization**: Initials calculation memoized
- **Optimized Renders**: Minimal re-renders with proper React hooks
- **Loading States**: Skeleton loaders prevent layout shift

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires localStorage support for banner persistence

## Future Enhancements

Potential improvements:
- Profile picture upload
- Edit profile information
- Account settings integration
- Activity history
- Security settings
- Connected devices management

## Related Documentation

- [Wallet Store](../src/store/wallet-store.ts)
- [Supabase Client](../src/lib/supabase-client.ts)
- [Design System](./README.md#design-system)
