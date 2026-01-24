<p align="center">
  <img src="https://github.com/user-attachments/assets/1cbfe0cc-4c25-488e-94d4-786666b2738d" alt="Galaxy Smart Wallet Logo" width="380">
</p>

**Galaxy Smart Wallet** is a decentralized wallet built on **Stellar**, designed for secure and on-chain asset management. Developed with **Next.js, TailwindCSS, and Zustand**, it provides a seamless and user-friendly interface for interacting with the Stellar blockchain.

## 🚀 Technologies Used

- [Next.js](https://nextjs.org) - A powerful React framework for modern web apps.
- [TailwindCSS](https://tailwindcss.com) - A utility-first CSS framework for styling.
- [Zustand](https://github.com/pmndrs/zustand) - A lightweight state management library.
- [Framer Motion](https://www.framer.com/motion/) - Smooth and optimized animations.
- [Stellar SDK](https://github.com/stellar/js-stellar-sdk) - Stellar blockchain integration.

---

## 🛠 Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Galaxy-KJ/galaxy-smart-wallet.git
cd galaxy-smart-wallet
```

### 2️⃣ Install Dependencies
```bash
npm install
# or using yarn
yarn install
# or using pnpm
pnpm install
```

### 3️⃣ Set Up Environment Variables
Create a **`.env.local`** file in the root directory with:
```
NEXT_PUBLIC_ENCRYPTION_KEY=your_secret_key
```

### 4️⃣ Start the Development Server
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application in action.

---

## 📖 Additional Resources

- [Next.js Docs](https://nextjs.org/docs) - Learn more about Next.js.
- [Stellar Docs](https://developers.stellar.org/docs) - Stellar documentation.
- [TailwindCSS Docs](https://tailwindcss.com/docs) - TailwindCSS guide.

---

## 🎨 Theme (Dark / Light)

- **Toggle**: Use the theme toggle in the header to switch between dark and light mode.
- **Persistence**: The selected theme is saved in `localStorage` under the key `galaxy-theme`.
- **Default**: If no saved preference exists, the app follows the system theme (`prefers-color-scheme`).

---

## 🤝 Contributing

We appreciate all contributions to improve **Galaxy Smart Wallet**! Before you start, please check our **[Contribution Guidelines](docs/CONTRIBUTORS_GUIDELINE.md)** to follow best practices for branching, commits, and collaboration.
