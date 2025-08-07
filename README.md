# Calendar App (React + Ant Design + json-server)

A **React** application for managing people's leaves on a calendar view, built with **Ant Design** components.  
Stores data persistently using **json-server** for both `events` and `dropdowns`.  
Includes advanced filtering, daily event lists, colored tags, and a statistics view.

---

## Features

- 🗓 **Calendar view** using Ant Design `Calendar`
- ➕ **Add / update / delete events** via modal form
- 🎯 **Advanced filtering** by Name, Type, Team, Domain, Location, Date Range
- 🏷 **Colored tags** for event types (colors stored in `typeColors`)
- 📚 **Dropdown management** (add/remove) — *password-protected modal*
- 🔐 **Manage Dropdowns** access control (password stored in DB)
- 📆 **3+ events per day compression** with clickable daily list modal
- 📈 **Statistics view** showing total days per person, type breakdown, last leave date
- 💾 **Persistent backend** via `json-server` (optional deploy on Render)

---

## Tech Stack

- **React** (Create React App)
- **Ant Design** UI library
- **dayjs** for date handling
- **uuid** for unique IDs
- **axios** for HTTP requests
- **json-server** for backend

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/emrehanci/calendar-app.git
cd calendar-app

# 2. Install dependencies
npm install

# 3. Start json-server (runs on port 3001)
npx json-server --watch db.json --port 3001

# 4. Start the React app (runs on port 3000)
npm start