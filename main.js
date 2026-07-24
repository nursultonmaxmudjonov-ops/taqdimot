const page1 = document.getElementById('page1');
const page2 = document.getElementById('page2');
const page3 = document.getElementById('page3');

const toPage2Btn = document.getElementById('toPage2');
const toPage3Btn = document.getElementById('toPage3');
const backToPage1Btn = document.getElementById('backToPage1');
const backToPage2Btn = document.getElementById('backToPage2');
const finishBtn = document.getElementById('finishBtn');

const phoneInput = document.getElementById('phoneInput');
const displayPhone = document.getElementById('displayPhone');
const otpInputs = document.querySelectorAll('.otp-input');

toPage2Btn.addEventListener('click', () => {
    page1.classList.remove('page-active');
    page1.classList.add('page-hidden-left');

    page2.classList.remove('page-hidden-right');
    page2.classList.add('page-active');
});

backToPage1Btn.addEventListener('click', () => {
    page2.classList.remove('page-active');
    page2.classList.add('page-hidden-right');

    page1.classList.remove('page-hidden-left');
    page1.classList.add('page-active');
});

toPage3Btn.addEventListener('click', () => {
    const val = phoneInput.value.trim();
    displayPhone.textContent = val ? `+998 ${val}` : '+998 -- --- -- --';

    page2.classList.remove('page-active');
    page2.classList.add('page-hidden-left');

    page3.classList.remove('page-hidden-right');
    page3.classList.add('page-active');
});

backToPage2Btn.addEventListener('click', () => {
    page3.classList.remove('page-active');
    page3.classList.add('page-hidden-right');

    page2.classList.remove('page-hidden-left');
    page2.classList.add('page-active');
});

otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
            otpInputs[index - 1].focus();
        }
    });
});

finishBtn.addEventListener('click', () => {
    alert("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
});

