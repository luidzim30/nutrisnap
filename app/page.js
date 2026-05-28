"use client";
import { useState, useEffect, useRef } from 'react';

export default function NutriSnapFunnel() {
    const [view, setView] = useState('welcome');
    const [step, setStep] = useState(1);
    const [goal, setGoal] = useState('');
    const [limitReached, setLimitReached] = useState(false);
    
    // Result States
    const [foodData, setFoodData] = useState(null);
    const [photoSrc, setPhotoSrc] = useState('');
    const [loadingTexts, setLoadingTexts] = useState(['Sincronizando seus objetivos...']);
    
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        // Load state from localStorage on client side
        const used = parseInt(localStorage.getItem('free_analyses') || '0');
        if (used >= 1) {
            setLimitReached(true);
            setView('paywall');
        }
    }, []);

    const startWizard = () => setView('wizard');

    const nextStep = (selectedGoal = null) => {
        if (selectedGoal) {
            setGoal(selectedGoal);
            localStorage.setItem('user_goal', selectedGoal);
        }
        if (step < 10) setStep(step + 1);
    };

    const finishWizard = () => {
        setView('analysis');
        runFakeAnalysis();
    };

    const runFakeAnalysis = () => {
        const items = [
            'Sincronizando seus objetivos...',
            'Ajustando calculos calóricos...',
            'Preparando identificação de alimentos...',
            'Leitor Desbloqueado!'
        ];
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setLoadingTexts(items.slice(0, i + 1));
            if (i >= items.length) {
                clearInterval(interval);
                setTimeout(() => openCamera(), 800);
            }
        }, 800);
    };

    const openCamera = async () => {
        setView('camera');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.log("Camera bloqueada ou indisponivel");
        }
    };

    const capturePhoto = () => {
        if (limitReached) {
            stopCamera();
            setView('paywall');
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 400;
        canvas.height = video.videoHeight || 400;
        const ctx = canvas.getContext('2d');
        
        if (video.videoWidth > 0) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        else { ctx.fillStyle = "#111"; ctx.fillRect(0,0,canvas.width,canvas.height); }

        setPhotoSrc(canvas.toDataURL('image/jpeg'));
        stopCamera();

        // Increment limit
        localStorage.setItem('free_analyses', '1');
        setLimitReached(true);

        setView('loading');
        setTimeout(() => showResults(), 3500);
    };

    const stopCamera = () => {
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };

    const showResults = () => {
        const hour = new Date().getHours();
        let eatNowStatus = "SIM, mas com moderação.";
        if (hour > 22 || hour < 6) eatNowStatus = "NÃO. Já é muito tarde, evite carboidratos pesados agora.";
        else if (hour > 11 && hour < 15) eatNowStatus = "SIM, excelente horário para sua refeição principal.";

        const db = [
            { name: "Prato Completo Saudável", cal: 420, p: 35, c: 40, f: 12, v: "Alto" },
            { name: "Lanche Rápido", cal: 550, p: 15, c: 60, f: 25, v: "Baixo" }
        ];

        const isEmagrecer = goal === 'emagrecer';
        const food = isEmagrecer ? db[1] : db[0]; 

        let fbClass = "ai-feedback success";
        let fbTitle = "Veredito Positivo";
        let fbText = "Bons nutrientes! Ajuda a sustentar energia ao longo do dia.";

        if(isEmagrecer && food.c > 50) {
            fbClass = "ai-feedback danger";
            fbTitle = "Alerta de Carboidrato";
            fbText = "Este prato possui muito carboidrato, o que atrasa sua perda de peso. Prefira mais proteínas e fibras na próxima refeição.";
        }

        setFoodData({ ...food, eatNowStatus, fbClass, fbTitle, fbText });
        setView('result');
    };

    // ------------- RENDERERS -------------
    if (view === 'welcome') return (
        <main className="view active">
            <div className="welcome-overlay"></div>
            <div className="welcome-content">
                <div className="trust-badge">⭐⭐⭐⭐⭐ 4.9/5 (12K+ Avaliações)</div>
                <h1 className="pro-title">Descubra o que o seu corpo realmente precisa.</h1>
                <p className="pro-subtitle">Responda a pesquisa rápida e libere seu leitor de pratos personalizado.</p>
                <ul className="pro-benefits">
                    <li>✓ Análise de calorias por foto</li>
                    <li>✓ Feedback instantâneo</li>
                    <li>✓ Resultados visíveis rápido</li>
                </ul>
                <button className="pro-btn pulse-glow" onClick={startWizard}>INICIAR AVALIAÇÃO AGORA</button>
            </div>
        </main>
    );

    if (view === 'wizard') return (
        <main className="view active">
            <div className="pro-header">
                <div className="progress-bar-pro"><div className="wizard-progress" style={{width: `${(step/10)*100}%`}}></div></div>
            </div>
            <div className="wizard-content">
                {step === 1 && (
                    <div className="w-step">
                        <h2>1. Qual é o seu objetivo principal?</h2>
                        <div className="pro-options">
                            <button className="pro-opt" onClick={() => nextStep('emagrecer')}><span className="emoji">🔥</span><div><strong>Emagrecer</strong></div></button>
                            <button className="pro-opt" onClick={() => nextStep('ganhar')}><span className="emoji">💪</span><div><strong>Ganhar Massa</strong></div></button>
                            <button className="pro-opt" onClick={() => nextStep('manter')}><span className="emoji">🥑</span><div><strong>Manter a Saúde</strong></div></button>
                        </div>
                    </div>
                )}
                {step === 2 && (
                    <div className="w-step">
                        <h2>2. Qual o seu gênero?</h2>
                        <div className="pro-options">
                            <button className="pro-opt" onClick={() => nextStep()}>Masculino</button>
                            <button className="pro-opt" onClick={() => nextStep()}>Feminino</button>
                        </div>
                    </div>
                )}
                {step === 3 && (
                    <div className="w-step">
                        <h2>3. Como é sua rotina de exercícios?</h2>
                        <div className="pro-options">
                            <button className="pro-opt" onClick={() => nextStep()}>Sedentária</button>
                            <button className="pro-opt" onClick={() => nextStep()}>Leve (1 a 2x semana)</button>
                            <button className="pro-opt" onClick={() => nextStep()}>Intensa (3x ou mais)</button>
                        </div>
                    </div>
                )}
                {step === 4 && (
                    <div className="w-step">
                        <h2>4. Quantas refeições você faz por dia?</h2>
                        <div className="pro-options">
                            <button className="pro-opt" onClick={() => nextStep()}>1 a 2 (Faço Jejum)</button>
                            <button className="pro-opt" onClick={() => nextStep()}>3 a 4</button>
                            <button className="pro-opt" onClick={() => nextStep()}>5 ou mais</button>
                        </div>
                    </div>
                )}
                {step === 5 && (
                    <div className="w-step">
                        <h2>5. Você bebe bastante água?</h2>
                        <div className="pro-options">
                            <button className="pro-opt" onClick={() => nextStep()}>Menos de 1 litro</button>
                            <button className="pro-opt" onClick={() => nextStep()}>1 a 2 litros</button>
                            <button className="pro-opt" onClick={() => nextStep()}>Mais de 2 litros</button>
                        </div>
                    </div>
                )}
                {step === 6 && (
                    <div className="w-step">
                        <h2>6. Como é a qualidade do seu sono?</h2>
                        <div className="pro-options">
                            <button className="pro-opt" onClick={() => nextStep()}>Ruim (Acordo muito)</button>
                            <button className="pro-opt" onClick={() => nextStep()}>Razoável</button>
                            <button className="pro-opt" onClick={() => nextStep()}>Excelente (Durmo a noite toda)</button>
                        </div>
                    </div>
                )}
                {step === 7 && (
                    <div className="w-step">
                        <h2>7. Sente muita fome à noite?</h2>
                        <div className="pro-options">
                            <button className="pro-opt" onClick={() => nextStep()}>Sim, muita</button>
                            <button className="pro-opt" onClick={() => nextStep()}>Às vezes</button>
                            <button className="pro-opt" onClick={() => nextStep()}>Não, durmo sem fome</button>
                        </div>
                    </div>
                )}
                {step === 8 && (
                    <div className="w-step">
                        <h2>8. Você tem alguma restrição alimentar?</h2>
                        <div className="pro-options">
                            <button className="pro-opt" onClick={() => nextStep()}>Nenhuma</button>
                            <button className="pro-opt" onClick={() => nextStep()}>Vegetariano / Vegano</button>
                            <button className="pro-opt" onClick={() => nextStep()}>Intolerância</button>
                        </div>
                    </div>
                )}
                {step === 9 && (
                    <div className="w-step">
                        <h2>9. O que mais te impede de ter o corpo ideal?</h2>
                        <div className="pro-options">
                            <button className="pro-opt" onClick={() => nextStep()}>Falta de tempo</button>
                            <button className="pro-opt" onClick={() => nextStep()}>Não sei escolher os alimentos</button>
                            <button className="pro-opt" onClick={() => nextStep()}>Falta de motivação</button>
                            <button className="pro-opt" onClick={() => nextStep()}>Ansiedade e Doces</button>
                        </div>
                    </div>
                )}
                {step === 10 && (
                    <div className="w-step">
                        <h2>10. Últimos detalhes</h2>
                        <p className="w-sub">Para calcular seu gasto calórico exato.</p>
                        <input type="number" className="pro-input" placeholder="Anos" />
                        <input type="number" className="pro-input mt-2" placeholder="Ex: 75kg" />
                        <button className="pro-btn mt-4" onClick={finishWizard}>CONCLUIR E LIBERAR APP</button>
                    </div>
                )}
            </div>
        </main>
    );

    if (view === 'analysis') return (
        <main className="view active">
            <div className="analysis-content">
                <div className="spinner-pro"></div>
                <h2>Configurando Leitor</h2>
                <ul className="analysis-list">
                    {loadingTexts.map((text, idx) => (
                        <li key={idx} className={idx < loadingTexts.length - 1 ? "done" : ""}>{text}</li>
                    ))}
                </ul>
            </div>
        </main>
    );

    if (view === 'camera') return (
        <main className="view active">
            <div className="camera-header"><span>Leitor de Pratos (1 Análise Livre)</span></div>
            <div className="camera-wrapper">
                <video ref={videoRef} autoPlay playsInline></video>
                <div className="scanner-overlay"></div>
            </div>
            <div className="controls">
                <button className="capture-btn-pro" onClick={capturePhoto}><div className="capture-inner"></div></button>
                <p>Tire a foto do prato agora</p>
            </div>
            <canvas ref={canvasRef} style={{display: 'none'}}></canvas>
        </main>
    );

    if (view === 'loading') return (
        <main className="view active">
            <div className="loader-container">
                <div className="ai-scanner">
                    <img src={photoSrc} alt="Imagem Capturada" />
                    <div className="scan-line"></div>
                </div>
                <h2>Identificando Nutrientes...</h2>
                <p>Mapeando proteínas, carboidratos e vitaminas.</p>
            </div>
        </main>
    );

    if (view === 'result' && foodData) return (
        <main className="view active">
            <div className="result-content">
                <div className="result-header">
                    <h2>{foodData.name}</h2>
                    <div className="calories-badge">
                        <span>{foodData.cal}</span><small>Kcal</small>
                    </div>
                </div>

                <div className={foodData.fbClass}>
                    <h4>{foodData.fbTitle}</h4>
                    <p>{foodData.fbText}</p>
                </div>

                <div className="eat-now-box">
                    <span>🤔 Devo comer isso agora?</span>
                    <strong>{foodData.eatNowStatus}</strong>
                </div>

                <div className="macros-grid">
                    <div className="macro-card protein"><div className="macro-icon">🥩</div><div className="macro-info"><span>Proteínas</span><h3>{foodData.p}g</h3></div></div>
                    <div className="macro-card carbs"><div className="macro-icon">🌾</div><div className="macro-info"><span>Carboidratos</span><h3>{foodData.c}g</h3></div></div>
                    <div className="macro-card fats"><div className="macro-icon">🥑</div><div className="macro-info"><span>Gorduras</span><h3>{foodData.f}g</h3></div></div>
                    <div className="macro-card vitamins"><div className="macro-icon">🍎</div><div className="macro-info"><span>Vitaminas/Fibras</span><h3>{foodData.v}</h3></div></div>
                </div>

                <div className="limit-warning mt-4"><p>⚠️ Limite gratuito atingido. Desbloqueie para ler mais pratos.</p></div>
                <button className="pro-btn btn-gold" onClick={() => setView('paywall')}>DESBLOQUEAR LEITOR ILIMITADO</button>
            </div>
        </main>
    );

    if (view === 'paywall') return (
        <main className="view active paywall-bg">
            <div className="paywall-content">
                <h2>Acesso Premium NutriSnap</h2>
                <p className="pw-sub">Chega de chutar calorias. Escaneie todas as suas refeições.</p>

                <div className="pricing-card">
                    <div className="discount-tag">LIBERAÇÃO IMEDIATA</div>
                    <div className="new-price">R$ 19,90<small>/mês</small></div>
                    <ul className="pw-benefits">
                        <li>✅ Leitor de pratos ilimitado</li>
                        <li>✅ Identificação de Vitaminas e Fibras</li>
                        <li>✅ Dicas do que comer na hora</li>
                        <li>✅ Avaliação de lanches rápidos</li>
                    </ul>
                </div>

                <button className="pro-btn btn-gold pulse-glow mt-4" onClick={() => alert('Checkout')}>LIBERAR ACESSO AGORA</button>

                <div className="guarantee-box">
                    <span className="shield">🛡️</span>
                    <p><strong>Risco Zero.</strong> Cancele a qualquer momento direto pelo aplicativo se não gostar dos resultados.</p>
                </div>
            </div>
        </main>
    );

    return null;
}
