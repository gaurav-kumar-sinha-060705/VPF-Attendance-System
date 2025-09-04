<div align="center">
</div>

# VPF Attendance System

A modern attendance tracking system built with React and Google Apps Script.

## Quick Start

1. Clone this repository
2. Install dependencies: `npm install`
3. Set up your Google Apps Script backend (see setup instructions below)
4. Run locally: `npm run dev`
5. Build for production: `npm run build`

## Setup Instructions

1. Create a new Google Apps Script project
2. Copy the contents of `App Script.txt` into your script
3. Set up your Google Sheets and Drive folders
4. Deploy as a web app and update the URL in `index.html`
5. Set the `API_KEY` in [.env.local](.env.local) to your API key

## Features

- Employee punch in/out with photo capture
- Face verification for security
- Real-time attendance tracking
- Admin dashboard for employee management
- CSV export functionality
- Responsive design for all devices

## Tech Stack

- React 19 with TypeScript
- Vite for build tooling
- Google Apps Script backend
- Google Sheets for data storage
- Google Drive for image storage
