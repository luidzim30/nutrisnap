document.addEventListener("DOMContentLoaded", () => {
    // ---- VIEW ELEMENTS ----
    const views = {
        welcome: document.getElementById('view-welcome'),
        register: document.getElementById('view-register'),
        onboarding: document.getElementById('view-onboarding'),
        camera: document.getElementById('view-camera'),
        loading: document.getElementById('view-loading'),
        result: document.getElementById('view-result'),
        paywall: document.getElementById('view-paywall')
    };

    function switchView(viewName) {
        Object.values(views).forEach(v => v.classList.remove('active'));
        views[viewName].classList.add('active');
    }

    // ---- STATE ----
    let userGoal = localStorage.getItem('user_goal') || '';
    let freeAnalysesUsed = parseInt(localStorage.getItem('free_analyses') || '0');

    // ---- WELCOME -> REGISTER ----
    document.getElementById('btn-start').addEventListener('click', () => {
        switchView('view-register');
    });

    // ---- REGISTER -> ONBOARDING ----
    document.getElementById('btn-register').addEventListener('click', () => {
        const email = document.getElementById('user-email').value;
        if(email) {
            localStorage.setItem('user_email', email);
            switchView('view-onboarding');
            updateProgress();
        } else {
            alert("Por favor, insira um e-mail.");
        }
    });

    // ---- ONBOARDING WIZARD ----
    const wizardSteps = document.querySelectorAll('.wizard-step');
    let currentStep = 1;
    
    function updateProgress() {
        const progress = (currentStep / wizardSteps.length) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
    }

    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Guarda o objetivo se for o step 1
            if(this.dataset.goal) {
                userGoal = this.dataset.goal;
                localStorage.setItem('user_goal', userGoal);
            }
            
            // Avança para o próximo step
            if(currentStep < wizardSteps.length) {
                wizardSteps[currentStep-1].classList.remove('active');
                currentStep++;
                wizardSteps[currentStep-1].classList.add('active');
                updateProgress();
            }
        });
    });

    // Finalizar Onboarding -> CAMERA
    document.getElementById('btn-finish-wizard').addEventListener('click', () => {
        switchView('view-camera');
        startCamera();
    });

    // ---- CAMERA LOGIC ----
    const video = document.getElementById('camera-stream');
    const canvas = document.getElementById('canvas');
    let stream = null;

    async function startCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = stream;
        } catch (err) {
            console.log("Câmera não permitida.");
        }
    }

    function stopCamera() {
        if (stream) stream.getTracks().forEach(track => track.stop());
    }

    // Capture / Teste Grátis / Paywall
    document.getElementById('capture-btn').addEventListener('click', () => {
        if(freeAnalysesUsed >= 1) {
            // PAYWALL BLOQUEIO
            stopCamera();
            switchView('paywall');
            return;
        }

        // Tira a foto
        canvas.width = video.videoWidth || 400;
        canvas.height = video.videoHeight || 400;
        const ctx = canvas.getContext('2d');
        if(video.videoWidth > 0) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        else { ctx.fillStyle = "#333"; ctx.fillRect(0,0,canvas.width,canvas.height); }
        
        document.getElementById('preview-image').src = canvas.toDataURL('image/jpeg');

        // Incrementa limite grátis
        freeAnalysesUsed++;
        localStorage.setItem('free_analyses', freeAnalysesUsed);

        stopCamera();
        
        // Atualiza texto de Loading
        const goalText = userGoal === 'emagrecer' ? 'Perder Peso' : userGoal === 'ganhar' ? 'Ganhar Massa' : 'Manter Saúde';
        document.getElementById('loading-goal').textContent = goalText;
        
        switchView('loading');

        setTimeout(showResults, 3000);
    });

    // ---- RESULTS LOGIC ----
    const foodDatabase = [
        { name: "Hambúrguer Artesanal", calories: 850, protein: 45, carbs: 55, fat: 48, type: "junk" },
        { name: "Salada com Frango", calories: 320, protein: 40, carbs: 15, fat: 10, type: "clean" },
        { name: "Prato Feito Tradicional", calories: 650, protein: 35, carbs: 80, fat: 20, type: "normal" }
    ];

    function showResults() {
        const randomFood = foodDatabase[Math.floor(Math.random() * foodDatabase.length)];
        
        document.getElementById('food-calories').textContent = randomFood.calories;
        document.getElementById('food-name').textContent = randomFood.name;
        document.getElementById('food-protein').textContent = randomFood.protein + "g";
        document.getElementById('food-carbs').textContent = randomFood.carbs + "g";
        document.getElementById('food-fats').textContent = randomFood.fat + "g";

        // LÓGICA DE PERSONALIZAÇÃO (A IA julgando)
        const feedbackBox = document.getElementById('ai-feedback');
        const feedbackTitle = document.getElementById('feedback-title');
        const feedbackText = document.getElementById('feedback-text');
        
        feedbackBox.className = 'ai-feedback'; // reset

        if (userGoal === 'emagrecer') {
            if (randomFood.calories > 600) {
                feedbackBox.classList.add('danger');
                feedbackTitle.textContent = "⚠️ Cuidado com as calorias";
                feedbackText.textContent = "Este prato tem muitas calorias e pode estourar o seu limite de emagrecimento para hoje. Tente algo mais leve.";
            } else {
                feedbackBox.classList.add('success');
                feedbackTitle.textContent = "✅ Perfeito para Secar";
                feedbackText.textContent = "Essa refeição se encaixa muito bem no seu déficit calórico!";
            }
        } else if (userGoal === 'ganhar') {
            if (randomFood.protein < 30) {
                feedbackBox.classList.add('danger');
                feedbackTitle.textContent = "⚠️ Faltou Proteína";
                feedbackText.textContent = "Para construir músculos, essa refeição precisava de mais proteínas. Considere adicionar um suplemento ou frango.";
            } else {
                feedbackBox.classList.add('success');
                feedbackTitle.textContent = "💪 Bom para Hipertrofia";
                feedbackText.textContent = "Boa quantidade de macros para apoiar o seu ganho de massa!";
            }
        } else {
            feedbackTitle.textContent = "🔍 Análise Geral";
            feedbackText.textContent = "Uma refeição balanceada. Continue focando em comer com moderação.";
        }

        switchView('result');
    }

    // Try again -> Checks limit
    document.getElementById('reset-btn').addEventListener('click', () => {
        if(freeAnalysesUsed >= 1) {
            switchView('paywall');
        } else {
            switchView('camera');
            startCamera();
        }
    });

    document.getElementById('btn-back-camera').addEventListener('click', () => {
        switchView('camera');
        startCamera();
    });

    // INIT CHECKS
    // Se o usuario der refresh na pagina, vemos se ele já estava no meio do funil
    if(localStorage.getItem('user_email') && freeAnalysesUsed >= 1) {
        switchView('paywall');
    }
});
