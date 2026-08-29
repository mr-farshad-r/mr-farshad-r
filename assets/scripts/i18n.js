(function () {
    "use strict";

    const translations = {
        en: {
            language: "Language",
            title: "Software Engineer and Front-End Developer",
            role: "Software Engineer",
            building: "Building ",
            nav: ["Blog", "About", "GitHub"],
            sections: ["About", "Skills", "Experience", "Connect", "Latest Post"],
            lead: "I'm a front-end engineer and team lead with 10+ years of experience building web and mobile products with React, TypeScript, and JavaScript.",
            intro: "I lead front-end teams, mentor engineers, and work across product, design, and back-end disciplines to turn complex requirements into accessible, scalable user experiences.",
            skillHeadings: ["Front-End", "Back-End", "Quality & Delivery"],
            jobs: [
                ["Specialist (Team Lead) / Senior Front-End Engineer", "2023 — Present", "Leading and mentoring a front-end team while delivering scalable fintech applications with React, Redux, TypeScript, Webpack, testing, accessibility, and CI/CD."],
                ["Senior Front-End Developer", "2022 — 2023", "Built enterprise software for the German market using React, React Query, SharePoint, PnP.js, and Highcharts."],
                ["Programming Teacher", "2017 — 2023", "Taught and mentored students across front-end and back-end web development, from JavaScript and React to Node.js and databases."],
                ["Earlier Experience", "2012 — 2022", "Co-founded a Cardano NFT product, led front-end teams, and shipped ERP, CRM, payments, real-time games, dashboards, and React Native applications."]
            ],
            linkDetails: ["@mr-farshad-r", "View professional profile", "@developina_", "@mr_farshad_r", "roozbahani.com", "Send a message"],
            allPosts: "All posts →",
            panel: ["About", "Profile", "Front-End", "Back-End", "Tools & DevOps", "Contact"],
            profile: "Front-End Engineer and team lead with 10+ years of experience building web and mobile products. I specialize in React and TypeScript, lead and mentor engineering teams, and care deeply about accessible, maintainable interfaces.",
            blog: ["← Back", "Blog", "Thoughts, notes, and things I learn along the way."],
            postBack: "← Back to blog",
            error: ["Page not found", "The page may have moved, been deleted, or never existed.", "Return home", "Browse the blog"],
            phrases: ["scalable React apps.", "accessible UIs.", "design systems.", "modern web experiences."]
        },
        fa: {
            language: "زبان",
            title: "مهندس نرم‌افزار و توسعه‌دهنده فرانت‌اند",
            role: "مهندس نرم‌افزار",
            building: "در حال ساخت ",
            nav: ["وبلاگ", "درباره من", "گیت‌هاب"],
            sections: ["درباره من", "مهارت‌ها", "تجربه کاری", "ارتباط", "آخرین نوشته"],
            lead: "مهندس فرانت‌اند و رهبر تیم با بیش از ۱۰ سال تجربه در ساخت محصولات وب و موبایل با React، TypeScript و JavaScript هستم.",
            intro: "تیم‌های فرانت‌اند را هدایت می‌کنم، به رشد مهندسان کمک می‌کنم و در همکاری با تیم‌های محصول، طراحی و بک‌اند، نیازهای پیچیده را به تجربه‌های کاربری دسترس‌پذیر و مقیاس‌پذیر تبدیل می‌کنم.",
            skillHeadings: ["فرانت‌اند", "بک‌اند", "کیفیت و تحویل"],
            jobs: [
                ["متخصص (رهبر تیم) / مهندس ارشد فرانت‌اند", "۱۴۰۲ — اکنون", "هدایت و منتورینگ تیم فرانت‌اند و توسعه اپلیکیشن‌های فین‌تک مقیاس‌پذیر با React، Redux، TypeScript، Webpack، تست، دسترس‌پذیری و CI/CD."],
                ["توسعه‌دهنده ارشد فرانت‌اند", "۱۴۰۱ — ۱۴۰۲", "توسعه نرم‌افزارهای سازمانی برای بازار آلمان با React، React Query، SharePoint، PnP.js و Highcharts."],
                ["مدرس برنامه‌نویسی", "۱۳۹۶ — ۱۴۰۲", "آموزش و راهنمایی دانشجویان در توسعه وب فرانت‌اند و بک‌اند؛ از JavaScript و React تا Node.js و پایگاه داده."],
                ["سوابق پیشین", "۱۳۹۱ — ۱۴۰۱", "هم‌بنیان‌گذاری یک محصول NFT کاردانو، هدایت تیم‌های فرانت‌اند و ساخت ERP، CRM، سامانه‌های پرداخت، بازی‌های آنلاین، داشبوردها و اپلیکیشن‌های React Native."]
            ],
            linkDetails: ["@mr-farshad-r", "مشاهده پروفایل حرفه‌ای", "@developina_", "@mr_farshad_r", "roozbahani.com", "ارسال پیام"],
            allPosts: "همه نوشته‌ها ←",
            panel: ["درباره من", "پروفایل", "فرانت‌اند", "بک‌اند", "ابزارها و DevOps", "تماس"],
            profile: "مهندس فرانت‌اند و رهبر تیم با بیش از ۱۰ سال تجربه در ساخت محصولات وب و موبایل هستم. در React و TypeScript تخصص دارم، تیم‌های مهندسی را هدایت و منتور می‌کنم و به رابط‌های دسترس‌پذیر و نگهداشت‌پذیر اهمیت می‌دهم.",
            blog: ["بازگشت ←", "وبلاگ", "یادداشت‌ها، تجربه‌ها و چیزهایی که در مسیر یاد می‌گیرم."],
            postBack: "بازگشت به وبلاگ ←",
            error: ["صفحه پیدا نشد", "ممکن است این صفحه جابه‌جا یا حذف شده باشد، یا هیچ‌وقت وجود نداشته باشد.", "بازگشت به خانه", "مشاهده وبلاگ"],
            phrases: ["اپلیکیشن‌های مقیاس‌پذیر React.", "رابط‌های کاربری دسترس‌پذیر.", "سیستم‌های طراحی.", "تجربه‌های مدرن وب."]
        }
    };

    const setText = (selector, value) => {
        const element = document.querySelector(selector);
        if (element && value !== undefined) element.textContent = value;
    };
    const setMany = (selector, values) => {
        document.querySelectorAll(selector).forEach((element, index) => {
            if (values[index] !== undefined) element.textContent = values[index];
        });
    };

    function applyLanguage(language) {
        const locale = translations[language] || translations.en;
        const isFa = language === "fa";
        document.documentElement.lang = language;
        document.documentElement.dir = isFa ? "rtl" : "ltr";
        document.body.classList.toggle("is-rtl", isFa);
        document.querySelector(".language-switcher")?.setAttribute("aria-label", locale.language);
        document.querySelectorAll("[data-language]").forEach((button) => {
            button.setAttribute("aria-pressed", String(button.dataset.language === language));
        });

        if (document.querySelector(".page")) {
            document.title = locale.title + " | Farshad Roozbahani";
            setText(".role", locale.role);
            const tagline = document.querySelector(".tagline");
            if (tagline && tagline.firstChild) tagline.firstChild.textContent = locale.building;
            setMany(".nav-links span", locale.nav);
            document.querySelectorAll(".section-title").forEach((heading, index) => {
                const number = heading.querySelector(".num");
                if (!number || locale.sections[index] === undefined) return;
                Array.from(heading.childNodes).forEach((node) => {
                    if (node !== number) node.remove();
                });
                heading.append(document.createTextNode(" " + locale.sections[index]));
            });
            setText(".lead", locale.lead);
            setText(".text-muted", locale.intro);
            setMany(".skill-col h3", locale.skillHeadings);
            document.querySelectorAll(".experience-item").forEach((item, index) => {
                const job = locale.jobs[index];
                if (!job) return;
                setText.call(null, `.experience-item:nth-child(${index + 1}) h3`, job[0]);
                setText.call(null, `.experience-item:nth-child(${index + 1}) time`, job[1]);
                setText.call(null, `.experience-item:nth-child(${index + 1}) > p`, job[2]);
            });
            setMany(".link-content small", locale.linkDetails);
            setText(".more-link", locale.allPosts);
            setMany(".panel-header span, .panel-body h2", locale.panel);
            setText(".panel-body > p", locale.profile);
        }

        if (document.querySelector(".blog-page")) {
            setText(".blog-header .back-link", locale.blog[0]);
            setText(".blog-header h1", locale.blog[1]);
            setText(".blog-header p", locale.blog[2]);
        }
        if (document.querySelector(".post")) setText(".post-header .back-link", locale.postBack);
        if (document.querySelector(".error-page")) {
            setText("#error-title", locale.error[0]);
            setText(".error-message", locale.error[1]);
            setMany(".error-actions a", locale.error.slice(2));
        }
        if (window.setTypingPhrases) window.setTypingPhrases(locale.phrases);
        try { localStorage.setItem("preferred-language", language); } catch (_) {}
    }

    document.querySelectorAll("[data-language]").forEach((button) => {
        button.addEventListener("click", () => applyLanguage(button.dataset.language));
    });
    let preferredLanguage = "en";
    try { preferredLanguage = localStorage.getItem("preferred-language") || "en"; } catch (_) {}
    applyLanguage(preferredLanguage);
    if (document.getElementById("typed")) typeLoop();
})();
