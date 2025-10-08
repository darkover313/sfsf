// قائمة المواد الدراسية
const SUBJECTS = [
    "كيمياء",
    "فيزياء",
    "قواعد",
    "أدب",
    "إسلامية",
    "أحياء"
];

const TOTAL_DAYS = 150;
const STORAGE_KEY = 'studyProgress';

// === متغيرات كلمة المرور ===
const CORRECT_PASSWORD = 'ilovesafa'; // <=== **يجب تغيير كلمة المرور هنا!**
const passwordModal = document.getElementById('password-modal');
const passwordInput = document.getElementById('password-input');
const passwordSubmit = document.getElementById('password-submit');
const passwordError = document.getElementById('password-error');
const appHeader = document.getElementById('app-header');
// =========================

const daysContainer = document.getElementById('days-container');
const modal = document.getElementById('celebration-modal');
const closeModal = document.querySelector('.close-button');

// 1. وظيفة تحميل وحفظ التقدم
//-----------------------------------------

function loadProgress() {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) {
        const defaultProgress = {};
        for (let i = 1; i <= TOTAL_DAYS; i++) {
            defaultProgress[i] = {
                tasks: SUBJECTS.map(() => false),
                completed: false
            };
        }
        return {
            days: defaultProgress,
            currentDay: 1
        };
    }
    return JSON.parse(json);
}

function saveProgress(progress) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

let progress = loadProgress();

// === وظيفة التحقق من كلمة المرور ===
function handlePasswordCheck() {
    const enteredPassword = passwordInput.value;

    if (enteredPassword === CORRECT_PASSWORD) {
        // كلمة المرور صحيحة: إظهار المحتوى وتهيئة التطبيق
        passwordModal.classList.remove('is-active');
        appHeader.classList.remove('hidden-content');
        daysContainer.classList.remove('hidden-content');
        initializeApp();
    } else {
        // كلمة المرور خاطئة
        passwordError.textContent = 'كلمة المرور غير صحيحة. حاولي مرة أخرى!';
        passwordInput.value = '';
    }
}

// إضافة مستمعي الأحداث لزر الدخول ومفتاح Enter
passwordSubmit.addEventListener('click', handlePasswordCheck);
passwordInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        handlePasswordCheck();
    }
});
// ===================================


// 2. وظيفة إنشاء بطاقة اليوم (HTML)
//-----------------------------------------

/**
 * إنشاء بطاقة HTML لليوم المحدد.
 */
function createDayCard(dayNumber) {
    const dayData = progress.days[dayNumber];
    const card = document.createElement('div');
    card.className = 'day-card';
    card.dataset.day = dayNumber;

    const isLocked = dayNumber > progress.currentDay;
    const isDisabled = dayData.completed || isLocked;

    if (dayData.completed) {
        card.classList.add('completed');
    } else if (dayNumber === progress.currentDay) {
        card.classList.add('current');
    } else if (isLocked) {
        card.classList.add('locked');
    }

    card.innerHTML = `
        <h2>اليوم رقم ${dayNumber}</h2>
        <ul class="task-list" id="tasks-${dayNumber}">
            ${SUBJECTS.map((subject, index) => `
                <li>
                    <input type="checkbox" id="day-${dayNumber}-task-${index}" data-task-index="${index}" 
                           ${dayData.tasks[index] ? 'checked' : ''} 
                           ${isDisabled ? 'disabled' : ''}>
                    <label for="day-${dayNumber}-task-${index}">${subject}</label>
                </li>
            `).join('')}
        </ul>
        <button class="complete-button" ${isDisabled ? 'disabled' : ''}>
            ${dayData.completed ? '✅ تم الإنجاز' : 'تم'}
        </button>
    `;

    // إضافة مستمعي الأحداث فقط إذا كان اليوم هو اليوم الحالي وغير مكتمل
    if (dayNumber === progress.currentDay && !dayData.completed) {
        const checkboxes = card.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => handleTaskChange(dayNumber, e.target));
        });

        const completeButton = card.querySelector('.complete-button');
        completeButton.addEventListener('click', () => handleDayCompletion(dayNumber, completeButton));
    }

    return card;
}

// 3. وظائف معالجة الأحداث والمنطق
//-----------------------------------------

function handleTaskChange(dayNumber, checkbox) {
    const taskIndex = parseInt(checkbox.dataset.taskIndex);
    progress.days[dayNumber].tasks[taskIndex] = checkbox.checked;
    saveProgress(progress);

    const allTasksCompleted = progress.days[dayNumber].tasks.every(task => task === true);
    const completeButton = document.querySelector(`.day-card[data-day="${dayNumber}"] .complete-button`);

    if (allTasksCompleted) {
        completeButton.disabled = false;
        completeButton.textContent = 'أنجزي اليوم! 🚀';
    } else {
        completeButton.disabled = true;
        completeButton.textContent = 'تم';
    }
}

function handleDayCompletion(dayNumber, button) {
    const dayData = progress.days[dayNumber];
    const currentCard = document.querySelector(`.day-card[data-day="${dayNumber}"]`);
    const nextDay = dayNumber + 1;

    const allTasksCompleted = dayData.tasks.every(task => task === true);
    if (!allTasksCompleted) {
        alert('يجب إكمال كل المهام قبل الضغط على "تم"!');
        return;
    }

    // تحديث حالة اليوم المكتمل
    progress.days[dayNumber].completed = true;
    currentCard.classList.remove('current');
    currentCard.classList.add('completed');
    currentCard.querySelector('.complete-button').textContent = '✅ تم الإنجاز';
    currentCard.querySelector('.complete-button').disabled = true;
    currentCard.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.disabled = true);

    // فتح اليوم التالي
    if (nextDay <= TOTAL_DAYS) {
        progress.currentDay = nextDay;
        const nextCard = document.querySelector(`.day-card[data-day="${nextDay}"]`);

        if (nextCard) {
            nextCard.classList.remove('locked');
            nextCard.classList.add('current');
            nextCard.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.disabled = false);
            nextCard.querySelector('.complete-button').disabled = true;
            nextCard.querySelector('.complete-button').textContent = 'تم';

            // إضافة مستمعي الأحداث لليوم الجديد
            nextCard.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => handleTaskChange(nextDay, e.target));
            });
            nextCard.querySelector('.complete-button').addEventListener('click', () => handleDayCompletion(nextDay, nextCard.querySelector('.complete-button')));
        }
    }

    saveProgress(progress);
    showCelebrationModal(dayNumber);
}

function showCelebrationModal(dayNumber) {
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const motivationalMessages = [
        "أحسنتِ أيتها المجتهدة الجميلة! ✨",
        "يا له من إنجاز! أنتِ حقاً رائعة! 💖",
        "استمري، فالمستقبل ينتظركِ! 🌟",
        "لقد أتممتِ مهامك ببراعة! 🎉",
        "خطوة أخرى نحو النجاح! بطلة! 💪"
    ];

    modalTitle.textContent = `تهانينا! اليوم ${dayNumber} مُنجز! 🎉`;
    modalMessage.textContent = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

    modal.style.display = 'block';

    if (dayNumber + 1 <= TOTAL_DAYS) {
        setTimeout(() => {
            document.querySelector(`.day-card[data-day="${dayNumber + 1}"]`).scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 800);
    }
}

// إغلاق الـ Modal
closeModal.onclick = () => {
    modal.style.display = "none";
}
window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// 4. تهيئة الصفحة (تتم الآن فقط بعد إدخال كلمة المرور الصحيحة)
//---------------------------------------------------------

function initializeApp() {
    // نتحقق أولاً مما إذا كانت الأيام قد تم إنشاؤها بالفعل
    if (daysContainer.children.length > 0) return; 

    for (let i = 1; i <= TOTAL_DAYS; i++) {
        const card = createDayCard(i);
        daysContainer.appendChild(card);
    }

    // الانتقال إلى اليوم الحالي عند التحميل
    const currentDayCard = document.querySelector(`.day-card[data-day="${progress.currentDay}"]`);
    if (currentDayCard) {
        currentDayCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // تفعيل/تعطيل زر "تم" لليوم الحالي بناءً على حالة الإنجاز المحفوظة
    const dayData = progress.days[progress.currentDay];
    if (dayData && progress.currentDay <= TOTAL_DAYS && !dayData.completed) {
        const allTasksCompleted = dayData.tasks.every(task => task === true);
        const completeButton = currentDayCard.querySelector('.complete-button');

        if (completeButton) {
             completeButton.disabled = !allTasksCompleted;
             if(allTasksCompleted) {
                 completeButton.textContent = 'أنجزي اليوم! 🚀';
             }
        }
    }
}
