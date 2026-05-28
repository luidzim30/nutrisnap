document.addEventListener("DOMContentLoaded", () => {
    const video = document.getElementById('camera-stream');
    const canvas = document.getElementById('canvas');
    const captureBtn = document.getElementById('capture-btn');
    const resetBtn = document.getElementById('reset-btn');
    const previewImage = document.getElementById('preview-image');

    const viewCamera = document.getElementById('camera-view');
    const viewLoading = document.getElementById('loading-view');
    const viewResult = document.getElementById('result-view');

    // UI Elements for Data
    const elName = document.getElementById('food-name');
    const elCalories = document.getElementById('food-calories');
    const elProtein = document.getElementById('food-protein');
    const elCarbs = document.getElementById('food-carbs');
    const elFats = document.getElementById('food-fats');

    // Mock Database
    const foodDatabase = [
        { name: "Prato Feito Tradicional", calories: 650, protein: 35, carbs: 80, fat: 20 },
        { name: "Salada com Frango Grelhado", calories: 320, protein: 40, carbs: 15, fat: 10 },
        { name: "Hambúrguer Artesanal", calories: 850, protein: 45, carbs: 55, fat: 48 },
        { name: "Pizza de Calabresa", calories: 580, protein: 22, carbs: 65, fat: 26 },
        { name: "Tigela de Açaí c/ Granola", calories: 450, protein: 8, carbs: 85, fat: 12 },
        { name: "Salmão com Legumes", calories: 410, protein: 38, carbs: 12, fat: 24 }
    ];

    let stream = null;

    // Iniciar Câmera
    async function startCamera() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            video.srcObject = stream;
        } catch (err) {
            console.error("Erro ao acessar a câmera: ", err);
            // Em caso de erro/bloqueio, apenas deixa preto
        }
    }

    // Parar Câmera
    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }

    // Trocar de Telas
    function switchView(viewToShow) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        viewToShow.classList.add('active');
    }

    // Tirar Foto
    captureBtn.addEventListener('click', () => {
        // Desenhar frame do video no canvas
        canvas.width = video.videoWidth || 400;
        canvas.height = video.videoHeight || 400;
        const ctx = canvas.getContext('2d');
        
        // Se a câmera estiver rodando, desenha a câmera. Senão, preenche com cor (mock)
        if(video.videoWidth > 0) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = "#333";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#fff";
            ctx.font = "20px Arial";
            ctx.fillText("Simulação de Imagem", 50, canvas.height/2);
        }
        
        // Obter imagem base64
        const dataUrl = canvas.toDataURL('image/jpeg');
        previewImage.src = dataUrl;

        // Mudar para Loading
        stopCamera();
        switchView(viewLoading);

        // Simular requisição de API com tempo aleatório (2 a 4 segundos)
        const analyzeTime = Math.floor(Math.random() * 2000) + 2000;
        
        setTimeout(() => {
            showResults();
        }, analyzeTime);
    });

    // Mostrar Resultados Aleatórios (Mock)
    function showResults() {
        // Selecionar alimento aleatório da base
        const randomFood = foodDatabase[Math.floor(Math.random() * foodDatabase.length)];
        
        // Animação de contagem para calorias
        animateValue(elCalories, 0, randomFood.calories, 1000);
        
        elName.textContent = randomFood.name;
        elProtein.textContent = randomFood.protein + "g";
        elCarbs.textContent = randomFood.carbs + "g";
        elFats.textContent = randomFood.fat + "g";

        switchView(viewResult);
    }

    // Voltar para Câmera
    resetBtn.addEventListener('click', () => {
        switchView(viewCamera);
        startCamera();
    });

    // Função para animar números (efeito visual bacana)
    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // Easing simples
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            obj.innerHTML = Math.floor(easeOutProgress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    // Iniciar app
    startCamera();
});
