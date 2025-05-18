# StatusFly

<div align="center">
  <img src="https://res.cloudinary.com/diyxwdtjd/image/upload/v1747590900/projects/statusfly.png" alt="StatusFly Logo" width="800" height="500">
</div>

<div align="center">
  <h3>Real-time status pages for your services</h3>

  <p align="center">
    A modern platform for monitoring and communicating service status with beautiful, shareable status pages.
    <br />
    <a href="https://statusfly.vercel.app">View Live Site</a>
    ·
    <a href="https://github.com/debsouryadatta/statusfly/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    ·
    <a href="https://github.com/debsouryadatta/statusfly/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>

## About The Project

StatusFly is a comprehensive status page platform that allows organizations to monitor and communicate the status of their services to users. With a focus on simplicity and real-time updates, StatusFly makes it easy to create and maintain beautiful status pages that keep your users informed about service availability.

## Features

- **Organization Management**: Create and manage organizations with their own status pages
- **Team Collaboration**: Add team members to collaborate on status management
- **Service Monitoring**: Track the status of multiple services in one place
- **Real-time Status Updates**: Update service status in real-time
- **Incident Management**: Create, track, and resolve incidents as they occur
- **Public Status Pages**: Share your status page with the public via a custom URL
- **Dark Mode Support**: Toggle between light and dark themes for comfortable viewing
- **Secure Authentication**: User account protection with Clerk authentication
- **Responsive Design**: Seamless experience across desktop and mobile devices
- **Dashboard Interface**: User-friendly dashboard to manage all your services and incidents

## Architecture

<div align="center">
  <img src="https://res.cloudinary.com/diyxwdtjd/image/upload/v1747591423/projects/archi_lbcw4e.png" alt="StatusFly Architecture" width="800">
</div>

## Database Schema

StatusFly uses a Neon Postgres database with the following data model:

```prisma
model User {
  id             String        @id    // coming from clerk
  email          String        @unique
  name           String
  organizationId String?
  role           String? // owner, member
  teamId         String?
  organization   Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  team           Team?         @relation(fields: [teamId], references: [id], onDelete: Cascade)
}

model Organization {
  id                  String     @id @default(cuid())
  name                String
  slug                String     @unique
  organizationMembers User[]
  teams               Team[]
  services            Service[]
  incidents           Incident[]
}

model Team {
  id             String       @id @default(cuid())
  name           String
  teamMembers    User[]
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}

model Service {
  id             String       @id @default(cuid())
  name           String
  status         String
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}

model Incident {
  id             String       @id @default(cuid())
  name           String
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  closedAt       DateTime?
}
```

### Built With

- [Next.js](https://nextjs.org/) - React Framework
- [TypeScript](https://www.typescriptlang.org/) - Programming Language
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Shadcn UI](https://ui.shadcn.com/) - UI Components
- [Clerk](https://clerk.com/) - Authentication
- [Prisma](https://www.prisma.io/) - Database ORM
- [Neon Postgres](https://neon.tech/) - Database
- [Tanstack React Query](https://tanstack.com/query/latest) - Data Fetching
- [Lucide React](https://lucide.dev/) - Icon Library
- [Next Themes](https://github.com/pacocoursey/next-themes) - Theme Management
- [Axios](https://axios-http.com/) - HTTP Client

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

* Git
* Node.js (v20 or higher)
* npm, yarn, or pnpm
* PostgreSQL database

### Installation

1. Clone the repository
   ```sh
   git clone https://github.com/debsouryadatta/statusfly.git
   ```
2. Install NPM packages
   ```sh
   npm install
   # or
   pnpm install
   ```
3. Create a `.env.local` file and add your environment variables
   ```sh
   DATABASE_URL=your_postgresql_database_url
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
   ```
4. Run Prisma migrations
   ```sh
   npx prisma migrate dev
   ```
5. Start the development server
   ```sh
   npm run dev
   # or
   pnpm dev
   ```

## Usage

1. Sign up for a StatusFly account
2. Create a new organization or join an existing one
3. Add services to monitor
4. Update service status as needed
5. Create incidents when issues occur
6. Share your public status page with users
7. Resolve incidents when issues are fixed
8. Toggle between light and dark modes for comfortable viewing

## Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Debsourya Datta - [@debsourya005](https://twitter.com/debsourya005) - debsouryadatta@gmail.com

Project Link: [https://github.com/debsouryadatta/statusfly](https://github.com/debsouryadatta/statusfly)

