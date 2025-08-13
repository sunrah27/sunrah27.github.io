document.addEventListener('DOMContentLoaded', () => {
    initSideNavIndicator();

    // ==============================
    // 1. WORK CARD IMAGE HOVER EFFECT
    // ==============================
    document.querySelectorAll('.work-card').forEach(card => {
        const img = card.querySelector('.work-image img');
        if (!img) return;

        card.addEventListener('mouseenter', () => {
            // clear any inline transform so keyframes control the motion cleanly
            img.style.transform = '';
            img.classList.add('scroll-animation');
        });

        card.addEventListener('mouseleave', () => {
            // 1) get the element's current computed transform (matrix or "none")
            const computed = window.getComputedStyle(img).transform;

            // 2) set that computed transform as an inline style so we have a fixed start point
            img.style.transform = (computed && computed !== 'none') ? computed : 'translateY(0)';

            // 3) remove the animation class (this restores the transition from the base CSS)
            img.classList.remove('scroll-animation');

            // 4) force reflow so the browser registers the inline transform as the current state
            void img.offsetWidth; // cheap reflow

            // 5) now set transform to the resting position and let the transition animate it
            img.style.transform = 'translateY(0)';

            // 6) cleanup inline transform after the transition completes (optional)
            const cleanup = () => {
                img.style.transform = '';
                img.removeEventListener('transitionend', cleanup);
            };
            img.addEventListener('transitionend', cleanup);
        });
    });

    // ==============================
    // 2. CAROUSEL FUNCTIONALITY
    // ==============================
    document.querySelectorAll('.carousel').forEach(carousel => {
        const items = carousel.querySelectorAll(".carousel-item");
        let currentIndex = 0;

        if (items.length > 1) {
            // ----- Create navigation buttons -----
            const buttonsHtml = Array.from(items, () => `<span class="carousel-button"></span>`);
            carousel.insertAdjacentHTML('beforeend', `
                <div class="carousel-nav">
                    ${buttonsHtml.join("")}
                </div>
            `);

            const buttons = carousel.querySelectorAll(".carousel-button");

            // ----- Navigation via buttons -----

            const goToSlide = (index) => {
                items.forEach(item => item.classList.remove("carousel-item-selected"));
                buttons.forEach(button => button.classList.remove("carousel-button-selected"));
                items[index].classList.add("carousel-item-selected");
                buttons[index].classList.add("carousel-button-selected");
                currentIndex = index;
            }

            buttons.forEach((button, i) => {
                button.addEventListener("click", () => goToSlide(i))
            })

            // ----- Initialize first slide -----
            goToSlide(0);

            // ==============================
            // 3. AUTO SCROLL
            // ==============================
            // setInterval(() => {
            //     const nextIndex = (currentIndex + 1) % items.length;
            //     goToSlide(nextIndex);
            // }, 4000); // Change every 4s

            // ==============================
            // 4. SWIPE/DRAG SUPPORT
            // ==============================
            let startX = 0;
            let isDragging = false;

            const startDrag = (x) => {
                startX = x;
                isDragging = true;
            };

            const endDrag = (x) => {
                if (!isDragging) return;
                const diff = x - startX;
                if (Math.abs(diff) > 50) { // swipe threshold
                    if (diff < 0) {
                        goToSlide((currentIndex + 1) % items.length); // swipe left → next
                    } else {
                        goToSlide((currentIndex - 1 + items.length) % items.length); // swipe right → prev
                    }
                }
                isDragging = false;
            };

            // Mouse events
            carousel.addEventListener("mousedown", e => startDrag(e.clientX));
            carousel.addEventListener("mouseup", e => endDrag(e.clientX));
            carousel.addEventListener("mouseleave", () => { isDragging = false; });

            // Touch events
            carousel.addEventListener("touchstart", e => startDrag(e.touches[0].clientX));
            carousel.addEventListener("touchend", e => endDrag(e.changedTouches[0].clientX));
        } else {
            // If only 1 item, just show it without nav
            items[0].classList.add("carousel-item-selected");
        }
    })

    // ==============================
    // CONTACT FORM AJAX SUBMISSION
    // ==============================
    const contactForm = document.getElementById("contact-form");
    const formStatus = document.getElementById("form-status");

    if (contactForm) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // stop the normal form submission

            const formData = new FormData(contactForm);
            const action = contactForm.action;

            formStatus.textContent = "Sending...";

            try {
                const response = await fetch(action, {
                    method: "POST",
                    body: formData,
                    headers: { "Accept": "application/json" }
                });

                if (response.ok) {
                    formStatus.textContent = "Thanks for your message! We'll get back to you soon.";
                    contactForm.reset();
                } else {
                    const data = await response.json();
                    if (data.errors) {
                        formStatus.textContent = data.errors.map(err => err.message).join(", ");
                    } else {
                        formStatus.textContent = "Oops! Something went wrong. Please try again.";
                    }
                }
            } catch (error) {
                formStatus.textContent = "Oops! Unable to send your message.";
            }
        });
    }
});

function initSideNavIndicator() {
    const nav = document.querySelector('.side-nav');
    if (!nav) return; // safety check

    const indicator = nav.querySelector('.indicator');
    const links = nav.querySelectorAll('.nav-link');

    function updateIndicator() {
        const activeLink = nav.querySelector('.nav-link.active');
        if (!activeLink) return;

        // Get distance from nav container top to active link top:
        const navRect = nav.getBoundingClientRect();
        const linkRect = activeLink.getBoundingClientRect();

        // Calculate offset relative to nav container:
        const offsetTop = linkRect.top - navRect.top;

        indicator.style.transform = `translateY(${offsetTop}px)`;
    }

    // Handle clicks
    links.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            updateIndicator();

            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // SIMPLE: Use Intersection Observer for scroll detection
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Remove active from all links
                links.forEach(l => l.classList.remove('active'));

                // Add active to the corresponding link
                const activeLink = nav.querySelector(`a[href="#${entry.target.id}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                    updateIndicator();
                }
            }
        });
    }, {
        rootMargin: '-50% 0px -50% 0px', // Trigger when section hits middle of viewport
        threshold: 0
    });

    // Observe all sections
    links.forEach(link => {
        const sectionId = link.getAttribute('href').substring(1);
        const section = document.getElementById(sectionId);
        if (section) {
            observer.observe(section);
        }
    });

    // Initial update
    updateIndicator();
}