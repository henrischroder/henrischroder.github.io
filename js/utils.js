export function isMobileDevice() {
    return window.matchMedia("(max-width: 768px)").matches || /Mobi|Android/i.test(navigator.userAgent);
}

// Reset character spans (unwrap text) and button styles
export function resetCharSpans(element) {
    if (!element) return;
    const charSpans = element.querySelectorAll('.char');
    charSpans.forEach(span => {
        const parent = span.parentNode;
        if (parent) {
            const text = document.createTextNode(span.textContent);
            parent.replaceChild(text, span);
            parent.normalize(); // Merge adjacent text nodes
        }
    });

    // Reset button styles to initial state
    const buttons = element.querySelectorAll('button, a');
    buttons.forEach(button => {
        button.style.opacity = '0';
        button.style.transform = 'translateY(15px)';
        button.style.animation = '';
        button.style.animationDelay = '';
    });
}

// Wrap text in character spans for staggered animation
export function wrapTextInChars(element) {
    if (!element) return;

    // Reset any existing character spans first
    resetCharSpans(element);

    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function (node) {
                // Skip text nodes inside buttons, links, and strong tags
                const parent = node.parentNode;
                if (parent && (parent.tagName === 'BUTTON' || parent.tagName === 'A' || parent.tagName === 'STRONG')) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        },
        false
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
        if (node.textContent.trim()) {
            textNodes.push(node);
        }
    }

    let globalCharIndex = 0;
    textNodes.forEach(textNode => {
        const text = textNode.textContent;
        const parent = textNode.parentNode;
        const fragment = document.createDocumentFragment();

        // Use spread operator to properly handle emojis and multi-byte characters
        const chars = [...text];

        chars.forEach(char => {
            if (char === ' ') {
                fragment.appendChild(document.createTextNode(' '));
            } else {
                const span = document.createElement('span');
                span.className = 'char';
                span.textContent = char;
                const charDelay = Math.min(globalCharIndex * 0.009, 0.6);
                span.style.animationDelay = `${charDelay}s`;
                fragment.appendChild(span);
                globalCharIndex++;
            }
        });

        parent.replaceChild(fragment, textNode);
    });

    // Animate buttons with staggered delay based on total character count
    const buttons = element.querySelectorAll('button, a');
    buttons.forEach((button, buttonIndex) => {
        // Calculate delay: after text characters + staggered per button
        const baseDelay = Math.min(globalCharIndex * 0.009, 0.6);
        const buttonDelay = baseDelay + (buttonIndex * 0.07) + 0.1;
        button.style.opacity = '0';
        button.style.transform = 'translateY(15px)';
        button.style.animation = 'buttonFadeIn 0.5s ease-out forwards';
        button.style.animationDelay = `${buttonDelay}s`;
    });
}
