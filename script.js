document.addEventListener('DOMContentLoaded', () => {

    const body = document.body;
    const welcomeOverlay = document.getElementById('welcome-overlay');
    const welcomeButton = document.getElementById('welcome-button');
    const mainContentWrapper = document.getElementById('main-content');
    const yearSpan = document.getElementById('current-year');
    const backToTopButton = document.getElementById('back-to-top');
    const animatedElementsOnScroll = document.querySelectorAll('.animate-on-scroll');
    const caseStudyRotator = document.getElementById('case-study-rotator');

    // --- Config ---
    const TYPING_SPEED_MS = 50; // Milliseconds per character (lower = faster)
    const TYPING_PAUSE_MS = 1500; // Pause after a section finishes typing

    // --- Helper: Delay Function ---
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // --- Helper: Typewriter Function ---
    async function typeWriter(element, textToType, speed) {
        return new Promise(async (resolve) => {
            element.innerHTML = ''; // Clear existing content
            element.classList.add('typing-cursor'); // Show cursor
            for (let i = 0; i < textToType.length; i++) {
                element.innerHTML += textToType.charAt(i);
                await delay(speed);
            }
            element.classList.remove('typing-cursor'); // Hide cursor
            resolve(); // Signal completion
        });
    }

    // --- Welcome Overlay Logic ---
    if (welcomeOverlay && welcomeButton && mainContentWrapper) {
        welcomeButton.addEventListener('click', () => {
            welcomeOverlay.classList.add('hidden');
            setTimeout(() => { welcomeOverlay.style.display = 'none'; }, 800);
            body.classList.remove('preload');
            triggerLoadAnimations(); // Trigger animations that should appear on load
        }, { once: true });
    } else {
        body.classList.remove('preload');
        triggerLoadAnimations();
    }

    // --- Animate elements visible on load ---
    function triggerLoadAnimations() {
        document.querySelectorAll('.animate-on-load').forEach(el => {
            setTimeout(() => el.classList.add('is-visible'), 50);
        });
    }

    // --- Dynamic Year in Footer ---
    if (yearSpan) { yearSpan.textContent = new Date().getFullYear(); }

    // --- Intersection Observer for Scroll Animations (General) ---
    if (animatedElementsOnScroll.length > 0 && 'IntersectionObserver' in window) {
        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                // Exclude case study text elements, they are handled separately
                if (entry.isIntersecting && !entry.target.closest('#case-study-rotator')) {
                    const delayVal = parseInt(entry.target.dataset.scrollDelay) || 0;
                     setTimeout(() => { entry.target.classList.add('is-visible'); }, delayVal);
                     observer.unobserve(entry.target);
                }
            });
        };
        const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
        const scrollObserver = new IntersectionObserver(observerCallback, observerOptions);
        animatedElementsOnScroll.forEach(element => scrollObserver.observe(element));
    } else {
        animatedElementsOnScroll.forEach(el => {
             if (!el.closest('#case-study-rotator')) {
                el.classList.add('is-visible');
             }
        });
    }

    // --- Case Study Typing Sequence Logic ---
    let currentCaseStudyIndex = 0;
    let caseStudySections = [];
    let caseStudyObserver = null;
    let isCaseStudyVisible = false; // Track visibility
    let isTypingSequenceRunning = false; // Prevent multiple runs

    if (caseStudyRotator && 'IntersectionObserver' in window) {
        caseStudySections = Array.from(caseStudyRotator.querySelectorAll('.case-study__section'));

        // Prepare sections: Store original text and clear visible text
        caseStudySections.forEach(section => {
            section.querySelectorAll('.case-study__text').forEach(textEl => {
                // If data-text attribute exists use it, otherwise use innerHTML
                const originalText = textEl.dataset.text || textEl.innerHTML;
                textEl.dataset.originalText = originalText; // Store it
                textEl.innerHTML = ''; // Clear visible text initially
            });
             section.classList.remove('is-active'); // Ensure all are inactive initially
        });


        // The main async function to run the sequence
        async function runCaseStudySequence() {
            if (isTypingSequenceRunning || caseStudySections.length === 0) return;
            isTypingSequenceRunning = true;

            while (isCaseStudyVisible) { // Loop only while visible
                const currentSection = caseStudySections[currentCaseStudyIndex];
                if (!currentSection) break; // Safety check

                // Activate the section container first
                currentSection.classList.add('is-active');

                // Find text elements within the *current active* section
                const textElementsToType = currentSection.querySelectorAll('.case-study__text');

                 // Wait slight delay for section fade-in & heading/icon appear
                 await delay(500);

                // Type out each text element sequentially
                for (const textEl of textElementsToType) {
                     // Check visibility before starting to type each element
                     if (!isCaseStudyVisible) {
                        isTypingSequenceRunning = false;
                        currentSection.classList.remove('is-active'); // Hide current section if user scrolled away
                        return; // Exit the function
                     }

                    const text = textEl.dataset.originalText || '';
                    if (text) {
                         // Ensure element is cleared before typing
                         textEl.innerHTML = '';
                        await typeWriter(textEl, text, TYPING_SPEED_MS);
                        await delay(200); // Short pause between elements
                    }
                }

                 // Check visibility again after finishing a section
                 if (!isCaseStudyVisible) {
                    isTypingSequenceRunning = false;
                    currentSection.classList.remove('is-active');
                    return; // Exit the function
                 }


                // Pause after the section is fully typed
                await delay(TYPING_PAUSE_MS);

                 // Check visibility one last time before hiding and moving on
                 if (!isCaseStudyVisible) {
                    isTypingSequenceRunning = false;
                    currentSection.classList.remove('is-active');
                    return; // Exit the function
                 }


                // Hide current section before moving to next
                currentSection.classList.remove('is-active');

                // Small delay before showing the next one for smoother visual transition
                await delay(400); // Match CSS transition duration

                // Move to the next index
                currentCaseStudyIndex = (currentCaseStudyIndex + 1) % caseStudySections.length;

                 // Reset text elements in the *next* section before it becomes active
                 // (Ensures clean start if loop restarts quickly)
                 const nextSection = caseStudySections[currentCaseStudyIndex];
                 if (nextSection) {
                    nextSection.querySelectorAll('.case-study__text').forEach(el => el.innerHTML = '');
                 }
            }
            // Loop ended because element is no longer visible
            isTypingSequenceRunning = false;
        }

        // Observer to start/stop the sequence
        caseStudyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (!isCaseStudyVisible) { // Start only if it wasn't visible before
                        // console.log("Case Study Visible - Starting Sequence");
                        isCaseStudyVisible = true;
                        runCaseStudySequence(); // Start the async sequence
                    }
                } else {
                    if (isCaseStudyVisible) { // Stop only if it was visible before
                        // console.log("Case Study Hidden - Stopping Sequence (flag set)");
                        isCaseStudyVisible = false;
                        // The running async function will check the flag and exit
                    }
                }
            });
        }, { threshold: 0.5 }); // Start when 50% visible

        caseStudyObserver.observe(caseStudyRotator);

    } else if (caseStudyRotator) {
         // Fallback: Show first section, no typing
         const sections = caseStudyRotator.querySelectorAll('.case-study__section');
         if (sections.length > 0) {
             sections[0].classList.add('is-active');
             // Manually set text content from data attribute if needed for fallback
              sections[0].querySelectorAll('.case-study__text').forEach(textEl => {
                 textEl.innerHTML = textEl.dataset.originalText || '';
             });
         }
    }


    // --- Back to Top Button Logic ---
    if (backToTopButton) { const scrollThreshold = 400; let scrollTimeout; const toggleBackToTopButton = () => { if (window.scrollY > scrollThreshold) { backToTopButton.classList.add('visible'); } else { backToTopButton.classList.remove('visible'); } }; window.addEventListener('scroll', () => { clearTimeout(scrollTimeout); scrollTimeout = setTimeout(toggleBackToTopButton, 150); }); backToTopButton.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); }); }

});