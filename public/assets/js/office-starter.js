document.addEventListener('DOMContentLoaded', () => {
    console.log('Office Starter Kit Loaded!');

    // Smooth scrolling for navigation links
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Adjust for sticky header
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add interactivity to buttons (placeholders for now)
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', () => {
            const action = button.textContent.trim();
            alert(`คุณได้คลิก: "${action}". ฟังก์ชันนี้กำลังอยู่ในระหว่างการพัฒนา`);
        });
    });
});
