# **App Name**: Tracklyo

## Core Features:

- User Authentication and Roles: Implement a multi-user system with 'PATRON' and 'RESPONSABLE' roles, managing user profiles with Firebase authentication. Admins can switch roles.
- Manager Selection and Filtering: Enable 'PATRON' users to select a 'RESPONSABLE', filtering all data views (Dashboard, Recaps, Finances...) to display only elements authored by the selected manager.
- Dashboard Overview: Display a comprehensive dashboard with a real-time balance, quick actions for adding reports and expenses, and data visualizations to support quick understanding of current events.
- Financial Transactions Management: Enable multi-currency transaction tracking with conversion, including income (BUDGET_ADD) and expenses (EXPENSE), with real-time balance updates. Block users from recording expenses beyond the estimated balance. Filter data based on the current selected manager.
- Activity Recap Management: Allow 'RESPONSABLE' users to create and manage activity recaps, including title, type (DAILY/WEEKLY), description, and media uploads. Enable comments on each recap.
- Calendar Event Scheduling: Implement a responsive calendar view (horizontal scrolling on mobile, weekly grid on desktop) for scheduling and displaying events. The schedule shows events filtered by the currently selected manager. 
- Paywall and User Management: When adding collaborators, check if the number of RESPONSBALEs already equals one. If so, show a Paywall Modal; otherwise show the user add modal.

## Style Guidelines:

- Primary color: Indigo (#4F46E5) for the app's main elements to provide a sense of trust and reliability.
- Background color: Desaturated indigo (#E4E6F7) to offer a light backdrop that complements the primary color without overpowering it.
- Accent color: Violet (#8B5CF6) to highlight interactive elements and add a touch of sophistication.
- Body and headline font: 'Plus Jakarta Sans' (if available), a sans-serif, for a modern, readable interface. Note: currently only Google Fonts are supported.
- Employ a modern, minimalist design with significant border radii (mimicking rounded-[2.5rem]) to soften the interface.
- Integrate Glassmorphism effects for navigation and modals (simulating backdrop-blur) to enhance visual depth.
- Use simple, outlined icons to maintain a clean and modern aesthetic.