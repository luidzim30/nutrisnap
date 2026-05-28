const app = {
    views: {},
    state: {
        goal: '',
        age: '',
        weight: '',
        goalWeight: '',
        email: ''
    },
    stream: null,
    freeAnalysesUsed: parseInt(localStorage.getItem('free_analyses') || '0'),

    init() {
        // Cache views
        document.querySelectorAll('.view').forEach(v => {
            this.views[v.id] = v;
        });

        // Check if user already used free trial and has email
        if(localStorage.getItem('user_email') && this.freeAnalysesUsed >= 1) {
            this.switchView('view-paywall');
            this.startTimer();
        }
    },

    switchView(viewId) {
        Object.values(this.views).forEach(v => v.classList.remove('active'));
        this.views[viewId].classList.add('active');
    },

    // ---- WIZARD FLOW ----
    currentStep: 1,
    startWizard() {
        this.switchView('view-wizard');
        this.updateProgress();
    },

    wizardNext(goalValue = null) {
        if(goalValue) this.state.goal = goalValue;

        const steps = document.querySelectorAll('.w-step');
        if(this.currentStep < steps.length) {
            steps[this.currentStep-1].classList.remove('active');
            this.currentStep++;
            steps[this.currentStep-1].classList.add('active');
            this.updateProgress();
        }
    },

    wizardBack() {
        if(this.currentStep > 1) {
            const steps = document.querySelectorAll('.w-step');
            steps[this.currentStep-1].classList.remove('active');
            this.currentStep--;
            steps[this.currentStep-1].classList.add('active');
            this.updateProgress();
        } else {
            this.switchView('view-welcome');
        }
    },

    updateProgress() {
        const total = document.querySelectorAll('.w-step').length;
        document.getElementById('wizard-progress').style.width = `${(this.currentStep/total)*100}%`;
    },

    finishWizard() {
        const age = document.getElementById('inp-age').value;
        const w = document.getElementById('inp-weight').value;
        const gw = document.getElementById('inp-goal-weight').value;

        if(!age || !w || !gw) {
            alert("Preencha todos os campos para a IA poder calcular.");
            return;
        }

        this.state.age = age;
        this.state.weight = w;
        this.state.goalWeight = gw;
        
        document.getElementById('show-goal-weight').textContent = gw;

        this.switchView('view-analysis');
        this.runFakeAnalysis();
    },

    // ---- FAKE ANALYSIS ----
    runFakeAnalysis() {
        const listItems = document.querySelectorAll('#analysis-list li');
        let index = 0;

        const interval = setInterval(() => {
            if(index > 0) listItems[index-1].style.color = "#10b981"; // success color
            
            if(index < listItems.length) {
                listItems[index].classList.remove('hidden');
                index++;
            } else {
                clearInterval(interval);
                setTimeout(() => this.switchView('view-capture'), 800);
            }
        }, 1200);
    },

    // ---- EMAIL CAPTURE ----
    submitEmail() {
        const email = document.getElementById('user-email').value;
        if(!email || !email.includes('@')) {
            alert("Por favor, digite um e-mail válido.");
            return;
        }
        
        this.state.email = email;
        localStorage.setItem('user_email', email);
        localStorage.setItem('user_goal', this.state.goal);

        // Define a data alvo para o grafico (ex: daqui 3 meses)
        const date = new Date();
        date.setMonth(date.getMonth() + 3);
        const options = { month: 'long', year: 'numeric' };
        document.getElementById('target-date').textContent = date.toLocaleDateString('pt-BR', options);

        this.switchView('view-chart');
    },

    // ---- CAMERA (FREE TRIAL) ----
    async openCamera() {
        this.switchView('view-camera');
        try {
            const video = document.getElementById('camera-stream');
            this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = this.stream;
        } catch (err) {
            console.log("Câmera bloqueada/indisponível.");
        }
    },

    capturePhoto() {
        if(this.freeAnalysesUsed >= 1) {
            this.showPaywall();
            return;
        }

        const video = document.getElementById('camera-stream');
        const canvas = document.getElementById('canvas');
        canvas.width = video.videoWidth || 400;
        canvas.height = video.videoHeight || 400;
        const ctx = canvas.getContext('2d');
        
        if(video.videoWidth > 0) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        else { ctx.fillStyle = "#111"; ctx.fillRect(0,0,canvas.width,canvas.height); }

        document.getElementById('preview-image').src = canvas.toDataURL('image/jpeg');

        if (this.stream) this.stream.getTracks().forEach(t => t.stop());

        this.freeAnalysesUsed++;
        localStorage.setItem('free_analyses', this.freeAnalysesUsed.toString());

        this.switchView('view-loading');
        setTimeout(() => this.showResults(), 3500);
    },

    // ---- RESULTS ----
    showResults() {
        const db = [
            { name: "Refeição Balanceada", cal: 420, p: 35, c: 40, f: 12 },
            { name: "Prato Calórico", cal: 850, p: 20, c: 80, f: 45 }
        ];
        // Força resultado ruim se quer emagrecer para criar dor, resultado bom caso contrário.
        // Isso é psicologia de PLG.
        const isEmagrecer = localStorage.getItem('user_goal') === 'emagrecer';
        const food = isEmagrecer ? db[1] : db[0]; 

        document.getElementById('food-calories').textContent = food.cal;
        document.getElementById('food-name').textContent = food.name;
        document.getElementById('food-protein').textContent = food.p + "g";
        document.getElementById('food-carbs').textContent = food.c + "g";
        document.getElementById('food-fats').textContent = food.f + "g";

        const fbBox = document.getElementById('ai-feedback');
        const fbTitle = document.getElementById('feedback-title');
        const fbText = document.getElementById('feedback-text');
        
        fbBox.className = 'ai-feedback'; // reset

        if(isEmagrecer) {
            fbBox.classList.add('danger');
            fbTitle.textContent = "🚨 Atenção ao Déficit Calórico";
            fbText.textContent = "Baseado no seu perfil, comer este prato com frequência vai atrasar sua meta de peso. O NutriSnap Premium pode montar alternativas deliciosas para você.";
        } else {
            fbBox.classList.add('success');
            fbTitle.textContent = "✅ Bons Macros";
            fbText.textContent = "Esta refeição atende os requisitos de energia. Com o Premium, ajustamos exatamente para sua hipertrofia.";
        }

        this.switchView('view-result');
    },

    // ---- PAYWALL ----
    showPaywall() {
        if(this.stream) this.stream.getTracks().forEach(t => t.stop());
        this.switchView('view-paywall');
        this.startTimer();
    },

    startTimer() {
        let time = 15 * 60; // 15 mins
        const el = document.getElementById('timer');
        const int = setInterval(() => {
            let m = Math.floor(time / 60);
            let s = time % 60;
            el.textContent = `${m}:${s < 10 ? '0':''}${s}`;
            time--;
            if(time < 0) clearInterval(int);
        }, 1000);
    }
};

document.addEventListener("DOMContentLoaded", () => app.init());
