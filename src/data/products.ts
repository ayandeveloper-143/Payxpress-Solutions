export interface Product {
    slug: string;
    title: string;
    description: string;
    tag: string;
    price: string;
    image: string;
    overview: string;
    shortNote: string;
    fullDescription: string;
    screenshots: string[];
    features: string[];
}

export const products: Product[] = [
    {
        slug: "web3-crypto-defi-app-ui-kit",
        title: "Web3: Crypto & DeFi App UI Kit Design for Android Studio",
        description: "20+ modern Android app screens for crypto wallet, trading, staking, and DeFi flows.",
        tag: "UI Kit",
        price: "₹4,999",
        image: "/uploads/web3.png",
        overview:
            "A production-ready Android UI kit for Web3 products, designed with clean crypto dashboards, token views, portfolio insights, and DeFi transaction flows across 20+ polished screens.",
        shortNote: "Built for startups launching wallet, exchange, NFT, or DeFi mobile apps faster.",
        fullDescription:
            "Web3: Crypto & DeFi App UI Kit Design for Android Studio gives your product team a strong visual foundation for building mobile blockchain apps. The kit includes more than 20 carefully structured Android screens covering onboarding, wallet balance, token details, market trends, swap flows, staking, transaction history, and security states. It is designed for fast product delivery, consistent UX, and easy customization inside Android Studio projects.",
        screenshots: [
            "/uploads/web3.png",
            "https://images.unsplash.com/photo-1639762681057-408e52192e55?w=1200&h=700&fit=crop",
            "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=1200&h=700&fit=crop",
            "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=1200&h=700&fit=crop",
        ],
        features: [
            "20+ Android-ready UI screens for Web3 and DeFi apps",
            "Wallet, portfolio, token details, and price tracking layouts",
            "Swap, staking, send, receive, and transaction flow screens",
            "Clean component system for easy Android Studio customization",
        ],
    },
    {
        slug: "1-vs-1-quiz-app-ui-design-kit",
        title: "1 vs 1 Quiz App UI Design Kit on Android Studio",
        description: "Competitive quiz battle UI kit with match rooms, live score screens, and player-vs-player challenge flows.",
        tag: "UI Kit",
        price: "₹4,499",
        image: "/uploads/quizlt.png",
        overview:
            "A competitive Android quiz UI kit built around 1 vs 1 gameplay, real-time score battles, category matchmaking, and fast-paced challenge screens.",
        shortNote: "Best for startups building quiz battle, trivia duel, and gamified learning apps.",
        fullDescription:
            "1 vs 1 Quiz App UI Design Kit on Android Studio gives your team a ready-made design system for building multiplayer quiz experiences on Android. The kit includes polished mobile screens for onboarding, player matchmaking, challenge invites, category selection, live question battles, timer states, win-loss summaries, rankings, rewards, and profile management. It is designed to make competitive learning apps feel engaging, modern, and easy to customize inside Android Studio workflows.",
        screenshots: [
            "/uploads/quizlt.png",
            "/uploads/quizlt.png",
            "/uploads/quizlt.png",
            "/uploads/quizlt.png",
        ],
        features: [
            "1 vs 1 player battle, invite, and matchmaking screens",
            "Live quiz flow with timer, score comparison, and answer states",
            "Leaderboard, rewards, and win-loss summary layouts",
            "Android-ready UI kit structure for quick product customization",
        ],
    },
    {
        slug: "restaurant-app-ui-design-kit",
        title: "Restaurant App Ui Design Kit On Android Studio",
        description: "Modern food ordering UI kit with menu browsing, table booking, cart, and delivery tracking screens.",
        tag: "UI Kit",
        price: "₹4,799",
        image: "/uploads/bistrofy.png",
        overview:
            "A polished Android restaurant app UI kit built for dining, takeaway, and food delivery products with clean menu, ordering, and reservation flows.",
        shortNote: "Strong fit for restaurant startups, cafe brands, and food delivery app concepts.",
        fullDescription:
            "Restaurant App Ui Design Kit On Android Studio gives your team a ready-made mobile interface system for restaurant and food ordering apps. The kit includes structured Android screens for onboarding, restaurant discovery, category filtering, menu details, cart flow, checkout, table reservation, order tracking, offers, and customer profile management. It is designed to help teams launch visually strong food products faster while keeping the UX clear and conversion-focused.",
        screenshots: [
            "/uploads/bistrofy.png",
            "/uploads/bistrofy.png",
            "/uploads/bistrofy.png",
            "/uploads/bistrofy.png",
        ],
        features: [
            "Restaurant listing, search, and food category screens",
            "Menu detail, add-to-cart, and checkout flow layouts",
            "Table booking, offers, and order tracking interfaces",
            "Android-ready UI kit structure for quick restaurant app customization",
        ],
    },
    {
        slug: "coursee-course-app-ui-design-kit",
        title: "Coursee- Course App UI Design Kit For Android Studio",
        description: "Android course app UI kit with lesson browsing, video classes, progress tracking, and instructor screens.",
        tag: "UI Kit",
        price: "₹2,999",
        image: "/uploads/online_course.png",
        overview:
            "A clean and modern Android UI kit for e-learning apps, built with course discovery, video lesson, progress, and student dashboard screens.",
        shortNote: "Great for education startups, coaching apps, and digital learning platforms.",
        fullDescription:
            "Coursee- Course App UI Design Kit For Android Studio gives product teams a ready-made interface foundation for building mobile education experiences. The kit includes organized Android screens for onboarding, featured courses, category browsing, instructor profiles, lesson details, video playback, saved courses, certificates, and learning progress. It is designed to help teams launch online course apps faster with a polished and user-friendly mobile experience.",
        screenshots: [
            "/uploads/online_course.png",
            "/uploads/online_course.png",
            "/uploads/online_course.png",
            "/uploads/online_course.png",
        ],
        features: [
            "Course listing, categories, and featured learning screens",
            "Lesson detail, video class, and progress tracking layouts",
            "Instructor profile, saved courses, and certificate views",
            "Android-ready UI kit structure for quick e-learning app customization",
        ],
    },
    {
        slug: "verseful-quote-shayari-app-android-studio-project",
        title: "Verseful Quote or Shayari App Android Studio Project",
        description: "A stylish Android quote and shayari app with category browsing, daily inspiration, and shareable reading screens.",
        tag: "Android Project",
        price: "₹3,499",
        image: "/uploads/verseful.png",
        overview:
            "A clean and engaging Android project for quote and shayari apps, built with elegant reading layouts, category discovery, favorites, and social sharing flows.",
        shortNote: "Ideal for quote apps, poetry communities, and daily motivation platforms.",
        fullDescription:
            "Verseful Quote or Shayari App Android Studio Project gives developers a ready-made mobile structure for building inspirational content apps on Android. The project includes polished screens for onboarding, quote categories, author collections, daily featured verses, favorites, search, detail reading, and share actions. It is designed to help teams launch visually pleasing quote or shayari apps faster while keeping the user experience simple, emotional, and easy to navigate.",
        screenshots: [
            "/uploads/verseful.png",
            "/uploads/verseful.png",
            "/uploads/verseful.png",
            "/uploads/verseful.png",
        ],
        features: [
            "Quote, shayari, and category browsing screens",
            "Favorites, search, and daily featured content layouts",
            "Reading detail pages with social share flow",
            "Android Studio project structure for quick content app customization",
        ],
    },
    {
        slug: "cabify-uber-like-cab-app-ui-android-studio",
        title: "cabify- Uber like Cab app Ui for Android Studio",
        description: "Modern ride-booking UI kit with live location, driver matching, trip status, and payment screens.",
        tag: "UI Kit",
        price: "₹4,999",
        image: "/uploads/cabify.png",
        overview:
            "A polished Android cab booking UI kit built for taxi, ride-hailing, and local transport apps with clean booking, driver, and trip management flows.",
        shortNote: "Useful for startups building Uber-like mobility, taxi, or shuttle booking apps.",
        fullDescription:
            "cabify- Uber like Cab app Ui for Android Studio gives teams a ready-made mobile interface system for building modern ride-booking apps on Android. The kit includes organized screens for onboarding, pickup and drop selection, map-based ride search, driver matching, fare estimate, trip confirmation, live tracking, wallet or card payment, ride history, and profile management. It is designed to help transport app teams move faster with a clean and familiar booking experience.",
        screenshots: [
            "/uploads/cabify.png",
            "/uploads/cabify.png",
            "/uploads/cabify.png",
            "/uploads/cabify.png",
        ],
        features: [
            "Pickup, drop, and live map booking screens",
            "Driver matching, fare estimate, and trip confirmation layouts",
            "Ride tracking, payment, and trip history interfaces",
            "Android-ready UI kit structure for quick cab app customization",
        ],
    },
    {
        slug: "spectra-vr-app-ui-design-kit",
        title: "Step into the Future with VR",
        description: "Immersive VR app UI design kit for Android Studio with futuristic onboarding, exploration, and experience discovery screens.",
        tag: "UI Kit",
        price: "₹5,499",
        image: "/uploads/spectra.png",
        overview:
            "A futuristic Android UI kit for VR products, built to showcase immersive experiences, interactive discovery flows, and next-generation digital environments.",
        shortNote: "Designed for startups building VR apps, immersive platforms, and virtual experience products.",
        fullDescription:
            "Step into the Future with VR is a modern Android UI design kit created for virtual reality apps and immersive experience platforms. Inspired by your concept, this product focuses on bringing the world of VR closer to people everywhere through sleek mobile interfaces. The kit includes polished screens for onboarding, headset connection, experience categories, featured worlds, event discovery, booking, profile management, and immersive content previews. It is built to help teams launch futuristic VR products faster with a premium and forward-looking design language.",
        screenshots: [
            "/uploads/spectra.png",
            "/uploads/spectra.png",
            "/uploads/spectra.png",
            "/uploads/spectra.png",
        ],
        features: [
            "VR onboarding, headset setup, and welcome screens",
            "Immersive experience discovery and featured world layouts",
            "Event booking, profile, and content preview interfaces",
            "Android-ready futuristic UI kit for quick VR app customization",
        ],
    },
    {
        slug: "aiflow-ai-app-ui-design-kit-android-studio",
        title: "Aiflow Ai App UI Design Kit For Android Studio",
        description: "Modern AI assistant UI kit with chat flows, smart prompts, history screens, and productivity dashboards.",
        tag: "UI Kit",
        price: "₹5,299",
        image: "/uploads/aiflow.png",
        overview:
            "A clean Android UI kit for AI-powered apps, built around conversational interfaces, smart tools, automation flows, and modern productivity experiences.",
        shortNote: "Ideal for startups building AI assistant, chatbot, writing, or workflow apps.",
        fullDescription:
            "Aiflow Ai App UI Design Kit For Android Studio gives teams a polished mobile interface system for building modern AI products on Android. The kit includes organized screens for onboarding, AI chat, prompt suggestions, task generation, conversation history, saved outputs, subscription plans, notifications, and user profile management. It is designed to help teams ship AI assistant apps faster with a premium interface that feels intelligent, efficient, and easy to use.",
        screenshots: [
            "/uploads/aiflow.png",
            "/uploads/aiflow.png",
            "/uploads/aiflow.png",
            "/uploads/aiflow.png",
        ],
        features: [
            "AI chat, prompt suggestion, and smart assistant screens",
            "Task generation, saved output, and history layouts",
            "Subscription, notification, and profile interfaces",
            "Android-ready UI kit structure for quick AI app customization",
        ],
    },
];

export const getProductBySlug = (slug: string) =>
    products.find((product) => product.slug === slug);
