const TAMANHO_MATRIZ = 5;
        const TURNOS_PARA_CRIAR_OBSTACULO = 5; 
        
        let matrizDoJogo = [];
        let listaDePecasAtivas = []; 
        let filaDeCooldownDeObstaculos = []; 

        let geradorDeIds = 1;
        let pontuacao = 0;
        
        let recordesPorDificuldade = JSON.parse(localStorage.getItem('2048_cyber_recordes_v2')) || {
            3: 0, 
            4: 0, 
            5: 0  
        };

        let bloqueiaMovimento = false; 
        let totalDeMovimentosValidos = 0;

        let limiteDeObstaculosNaTela = 4; 
        let habilidadeSelecionada = null; 
        let pecaParaTroca = null; 
        let usosDestruir = 3;
        let usosTrocar = 3;

        const elementos = {
            telaInicial: document.getElementById('tela-inicial'),
            jogoPrincipal: document.getElementById('jogo-principal'),
            fundoTabuleiro: document.getElementById('fundo-do-tabuleiro'),
            camadaPecas: document.getElementById('camada-de-pecas'),
            txtPontuacao: document.getElementById('pontuacao-atual'),
            txtRecorde: document.getElementById('pontuacao-recorde'),
            telaGameOver: document.getElementById('tela-game-over'),
            containerTabuleiro: document.getElementById('container-do-tabuleiro'),
            btnDestruir: document.getElementById('btn-destruir'),
            btnTrocar: document.getElementById('btn-trocar'),
            txtUsosDestruir: document.getElementById('cargas-destruir'),
            txtUsosTrocar: document.getElementById('cargas-trocar'),
            seletorDificuldade: document.getElementById('seletor-dificuldade')
        };

        elementos.txtRecorde.textContent = recordesPorDificuldade[limiteDeObstaculosNaTela];

        elementos.seletorDificuldade.addEventListener('change', (evento) => {
            limiteDeObstaculosNaTela = parseInt(evento.target.value);
            elementos.txtRecorde.textContent = recordesPorDificuldade[limiteDeObstaculosNaTela]; 
            prepararNovoJogo();
        });

        function desenharFundoDoTabuleiro() {
            elementos.fundoTabuleiro.innerHTML = '';
            for (let i = 0; i < TAMANHO_MATRIZ * TAMANHO_MATRIZ; i++) {
                const celula = document.createElement('div');
                celula.className = 'grid-cell';
                elementos.fundoTabuleiro.appendChild(celula);
            }
        }
        desenharFundoDoTabuleiro();

        function iniciarInterfaceDoJogo() {
            elementos.telaInicial.classList.add('opacity-0');
            setTimeout(() => {
                elementos.telaInicial.classList.add('escondido');
                elementos.jogoPrincipal.classList.remove('escondido');
                prepararNovoJogo();
            }, 500);
        }

        function prepararNovoJogo() {
            matrizDoJogo = [];
            for (let linha = 0; linha < TAMANHO_MATRIZ; linha++) {
                let novaLinha = [];
                for (let coluna = 0; coluna < TAMANHO_MATRIZ; coluna++) {
                    novaLinha.push(null);
                }
                matrizDoJogo.push(novaLinha);
            }

            listaDePecasAtivas.forEach(peca => peca.elementoVisual && peca.elementoVisual.remove());
            listaDePecasAtivas = [];
            filaDeCooldownDeObstaculos = [];
            
            pontuacao = 0;
            totalDeMovimentosValidos = 0;
            usosDestruir = 3;
            usosTrocar = 3;
            
            atualizarPontuacao(0);
            atualizarInterfaceHabilidades();
            alternarHabilidade(null);
            
            elementos.telaGameOver.classList.add('opacity-0', 'pointer-events-none');
            bloqueiaMovimento = false;

            gerarPecaNumericaAleatoria();
            gerarPecaNumericaAleatoria();
        }

        function obterCoordenadasVazias() {
            let vazios = [];
            for (let linha = 0; linha < TAMANHO_MATRIZ; linha++) {
                for (let coluna = 0; coluna < TAMANHO_MATRIZ; coluna++) {
                    if (matrizDoJogo[linha][coluna] === null) {
                        vazios.push({ linha: linha, coluna: coluna });
                    }
                }
            }
            return vazios;
        }

        function gerarPecaNumericaAleatoria() {
            const vazios = obterCoordenadasVazias();
            if (vazios.length === 0) return;
            
            const indiceAleatorio = Math.floor(Math.random() * vazios.length);
            const posicao = vazios[indiceAleatorio];
            const valorInicial = Math.random() < 0.9 ? 2 : 4; 
            
            instanciarPecaNoTabuleiro(posicao.linha, posicao.coluna, valorInicial, false);
        }

        function gerarObstaculo(ignorarLimite = false) {
            let totalDeX = 0;
            listaDePecasAtivas.forEach(peca => { if(peca.ehObstaculo) totalDeX++; });
            
            if (!ignorarLimite && totalDeX >= limiteDeObstaculosNaTela) return;

            const vazios = obterCoordenadasVazias();
            if (vazios.length === 0) return;
            
            const posicao = vazios[Math.floor(Math.random() * vazios.length)];
            instanciarPecaNoTabuleiro(posicao.linha, posicao.coluna, 'X', true);
        }

        function instanciarPecaNoTabuleiro(linha, coluna, valor, ehObstaculo) {
            const novaPeca = {
                id: geradorDeIds++,
                linha: linha,
                coluna: coluna,
                valor: valor,
                ehObstaculo: ehObstaculo,
                elementoVisual: null,
                recemFundida: false 
            };
            
            matrizDoJogo[linha][coluna] = novaPeca;
            listaDePecasAtivas.push(novaPeca);
            
            const div = document.createElement('div');
            let classeCss = ehObstaculo ? 'peca-obstaculo' : obterClassePorValor(valor);
            div.className = `tile pop ${classeCss}`;
            div.textContent = valor;
            
            div.style.setProperty('--linha', linha);
            div.style.setProperty('--coluna', coluna);
            
            elementos.camadaPecas.appendChild(div);
            novaPeca.elementoVisual = div;
        }

        function obterClassePorValor(valor) {
            if (valor > 2048) return 'peca-super';
            return `peca-${valor}`;
        }

        function atualizarPontuacao(pontosGanhos) {
            pontuacao += pontosGanhos;
            elementos.txtPontuacao.textContent = pontuacao;
            
            if (pontuacao > recordesPorDificuldade[limiteDeObstaculosNaTela]) {
                recordesPorDificuldade[limiteDeObstaculosNaTela] = pontuacao;
                elementos.txtRecorde.textContent = recordesPorDificuldade[limiteDeObstaculosNaTela];
                localStorage.setItem('2048_cyber_recordes_v2', JSON.stringify(recordesPorDificuldade));
            }
        }

        function atualizarInterfaceHabilidades() {
            elementos.txtUsosDestruir.textContent = usosDestruir;
            elementos.txtUsosTrocar.textContent = usosTrocar;
            
            elementos.btnDestruir.disabled = (usosDestruir <= 0);
            elementos.btnTrocar.disabled = (usosTrocar <= 0);
        }

        function alternarHabilidade(tipo) {
            if (habilidadeSelecionada === tipo) tipo = null; 
            if (tipo === 'destruir' && usosDestruir <= 0) return;
            if (tipo === 'trocar' && usosTrocar <= 0) return;
            
            habilidadeSelecionada = tipo;
            pecaParaTroca = null;

            elementos.btnDestruir.classList.remove('habilidade-ativa-destruir');
            elementos.btnTrocar.classList.remove('habilidade-ativa-trocar');
            elementos.containerTabuleiro.classList.remove('modo-alvo');

            listaDePecasAtivas.forEach(peca => {
                if(peca.elementoVisual) {
                    peca.elementoVisual.style.boxShadow = '';
                    peca.elementoVisual.style.transform = '';
                }
            });

            if (tipo === 'destruir') {
                elementos.btnDestruir.classList.add('habilidade-ativa-destruir');
                elementos.containerTabuleiro.classList.add('modo-alvo');
            } else if (tipo === 'trocar') {
                elementos.btnTrocar.classList.add('habilidade-ativa-trocar');
                elementos.containerTabuleiro.classList.add('modo-alvo');
            }
        }

        elementos.camadaPecas.addEventListener('click', (evento) => {
            if (!habilidadeSelecionada || bloqueiaMovimento) return;
            
            const htmlPeca = evento.target.closest('.tile');
            if (!htmlPeca) return;

            const linhaClicada = parseInt(htmlPeca.style.getPropertyValue('--linha'));
            const colunaClicada = parseInt(htmlPeca.style.getPropertyValue('--coluna'));
            const objetoPeca = matrizDoJogo[linhaClicada][colunaClicada];
            
            if (!objetoPeca) return;

            if (habilidadeSelecionada === 'destruir') {
                usarPoderDestruicao(objetoPeca);
            } else if (habilidadeSelecionada === 'trocar') {
                usarPoderTroca(objetoPeca);
            }
        });

        function usarPoderDestruicao(peca) {
            if (peca.ehObstaculo) {
                filaDeCooldownDeObstaculos.push(10); 
            }
            
            matrizDoJogo[peca.linha][peca.coluna] = null;
            listaDePecasAtivas = listaDePecasAtivas.filter(p => p.id !== peca.id);
            
            peca.elementoVisual.style.transform = 'scale(0)';
            setTimeout(() => peca.elementoVisual.remove(), 200);
            
            usosDestruir--;
            atualizarInterfaceHabilidades();
            alternarHabilidade(null); 
            verificarDerrota(); 
        }

        function usarPoderTroca(peca) {
            if (!pecaParaTroca) {
                pecaParaTroca = peca;
                peca.elementoVisual.style.boxShadow = '0 0 30px #00ffff, inset 0 0 20px #00ffff';
                peca.elementoVisual.style.transform = 'scale(1.1)';
            } else {
                if (pecaParaTroca.id !== peca.id) {
                    const tempLinha = pecaParaTroca.linha;
                    const tempColuna = pecaParaTroca.coluna;

                    pecaParaTroca.linha = peca.linha;
                    pecaParaTroca.coluna = peca.coluna;
                    peca.linha = tempLinha;
                    peca.coluna = tempColuna;

                    matrizDoJogo[pecaParaTroca.linha][pecaParaTroca.coluna] = pecaParaTroca;
                    matrizDoJogo[peca.linha][peca.coluna] = peca;

                    pecaParaTroca.elementoVisual.style.setProperty('--linha', pecaParaTroca.linha);
                    pecaParaTroca.elementoVisual.style.setProperty('--coluna', pecaParaTroca.coluna);
                    peca.elementoVisual.style.setProperty('--linha', peca.linha);
                    peca.elementoVisual.style.setProperty('--coluna', peca.coluna);
                    
                    usosTrocar--;
                    atualizarInterfaceHabilidades();
                }
                alternarHabilidade(null);
                verificarDerrota();
            }
        }

        function processarMovimento(direcao) {
            if (habilidadeSelecionada) alternarHabilidade(null);
            if (bloqueiaMovimento) return;
            
            let ocorreuMovimento = false;
            
            let deltaLinha = 0, deltaColuna = 0;
            if (direcao === 'cima') deltaLinha = -1;
            else if (direcao === 'baixo') deltaLinha = 1;
            else if (direcao === 'esquerda') deltaColuna = -1;
            else if (direcao === 'direita') deltaColuna = 1;

            let inicioLinha = (direcao === 'baixo') ? TAMANHO_MATRIZ - 1 : 0;
            let fimLinha = (direcao === 'baixo') ? -1 : TAMANHO_MATRIZ;
            let passoLinha = (direcao === 'baixo') ? -1 : 1;

            let inicioColuna = (direcao === 'direita') ? TAMANHO_MATRIZ - 1 : 0;
            let fimColuna = (direcao === 'direita') ? -1 : TAMANHO_MATRIZ;
            let passoColuna = (direcao === 'direita') ? -1 : 1;

            for (let linha = inicioLinha; linha !== fimLinha; linha += passoLinha) {
                for (let coluna = inicioColuna; coluna !== fimColuna; coluna += passoColuna) {
                    
                    let pecaAtual = matrizDoJogo[linha][coluna];
                    if (!pecaAtual) continue; 

                    let l_atual = linha;
                    let c_atual = coluna;

                    while (true) {
                        let l_proxima = l_atual + deltaLinha;
                        let c_proxima = c_atual + deltaColuna;

                        if (l_proxima < 0 || l_proxima >= TAMANHO_MATRIZ || c_proxima < 0 || c_proxima >= TAMANHO_MATRIZ) {
                            break;
                        }

                        let vizinho = matrizDoJogo[l_proxima][c_proxima];

                        if (!vizinho) {
                            matrizDoJogo[l_proxima][c_proxima] = pecaAtual;
                            matrizDoJogo[l_atual][c_atual] = null;
                            
                            pecaAtual.linha = l_proxima;
                            pecaAtual.coluna = c_proxima;
                            
                            l_atual = l_proxima;
                            c_atual = c_proxima;
                            ocorreuMovimento = true;
                        } 
                        else if (!vizinho.ehObstaculo && !pecaAtual.ehObstaculo && vizinho.valor === pecaAtual.valor && !vizinho.recemFundida) {
                            matrizDoJogo[l_atual][c_atual] = null;
                            
                            pecaAtual.linha = l_proxima;
                            pecaAtual.coluna = c_proxima;
                            
                            pecaAtual.fundidaCom = vizinho; 
                            vizinho.recemFundida = true; 
                            
                            ocorreuMovimento = true;
                            break; 
                        } 
                        else {
                            break; 
                        }
                    }
                }
            }

            if (ocorreuMovimento) {
                finalizarTurno();
            }
        }

        function finalizarTurno() {
            bloqueiaMovimento = true;
            totalDeMovimentosValidos++; 
            let pontosGanhosNesteTurno = 0;

            listaDePecasAtivas.forEach(peca => {
                if (peca.elementoVisual) {
                    peca.elementoVisual.style.setProperty('--linha', peca.linha);
                    peca.elementoVisual.style.setProperty('--coluna', peca.coluna);
                }
            });

            listaDePecasAtivas = listaDePecasAtivas.filter(peca => {
                if (peca.fundidaCom) {
                    peca.elementoVisual.style.zIndex = '0';
                    setTimeout(() => peca.elementoVisual.remove(), 150);
                    return false;
                }
                
                if (peca.recemFundida) {
                    peca.valor *= 2;
                    peca.recemFundida = false;
                    pontosGanhosNesteTurno += peca.valor;

                    const popup = document.createElement('div');
                    popup.className = 'score-flutuante orbitron';
                    popup.textContent = '+' + peca.valor;
                    popup.style.setProperty('--linha', peca.linha);
                    popup.style.setProperty('--coluna', peca.coluna);
                    elementos.camadaPecas.appendChild(popup);
                    setTimeout(() => popup.remove(), 800);
                    
                    setTimeout(() => {
                        peca.elementoVisual.className = `tile pop ${obterClassePorValor(peca.valor)}`;
                        peca.elementoVisual.textContent = peca.valor;
                    }, 150);
                }
                return true;
            });

            if (pontosGanhosNesteTurno > 0) atualizarPontuacao(pontosGanhosNesteTurno);

            setTimeout(() => {
                gerarPecaNumericaAleatoria(); 
                processarGeraisEObstaculos();
                verificarDerrota();
                bloqueiaMovimento = false;
            }, 160);
        }

        function processarGeraisEObstaculos() {
            let totalDeObstaculos = 0;
            listaDePecasAtivas.forEach(peca => { if(peca.ehObstaculo) totalDeObstaculos++; });
            
            if (totalDeMovimentosValidos % TURNOS_PARA_CRIAR_OBSTACULO === 0) {
                if ((totalDeObstaculos + filaDeCooldownDeObstaculos.length) < limiteDeObstaculosNaTela) {
                    gerarObstaculo();
                }
            }

            for (let i = filaDeCooldownDeObstaculos.length - 1; i >= 0; i--) {
                filaDeCooldownDeObstaculos[i]--; 
                
                if (filaDeCooldownDeObstaculos[i] <= 0) {
                    filaDeCooldownDeObstaculos.splice(i, 1);
                    gerarObstaculo(true); 
                }
            }
        }

        function verificarDerrota() {
            if (obterCoordenadasVazias().length > 0) return; 

            for (let linha = 0; linha < TAMANHO_MATRIZ; linha++) {
                for (let coluna = 0; coluna < TAMANHO_MATRIZ; coluna++) {
                    let atual = matrizDoJogo[linha][coluna];
                    if (atual.ehObstaculo) continue; 

                    if (coluna < TAMANHO_MATRIZ - 1) {
                        let direita = matrizDoJogo[linha][coluna + 1];
                        if (direita && !direita.ehObstaculo && direita.valor === atual.valor) return; 
                    }
                    if (linha < TAMANHO_MATRIZ - 1) {
                        let baixo = matrizDoJogo[linha + 1][coluna];
                        if (baixo && !baixo.ehObstaculo && baixo.valor === atual.valor) return; 
                    }
                }
            }
            
            elementos.telaGameOver.classList.remove('opacity-0', 'pointer-events-none');
        }

        window.addEventListener('keydown', evento => {
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(evento.key)) {
                if(!elementos.jogoPrincipal.classList.contains('escondido')) evento.preventDefault();
            }
            
            if(elementos.telaInicial.classList.contains('escondido')) {
                if (evento.key === 'ArrowUp' || evento.key === 'w' || evento.key === 'W') processarMovimento('cima');
                if (evento.key === 'ArrowDown' || evento.key === 's' || evento.key === 'S') processarMovimento('baixo');
                if (evento.key === 'ArrowLeft' || evento.key === 'a' || evento.key === 'A') processarMovimento('esquerda');
                if (evento.key === 'ArrowRight' || evento.key === 'd' || evento.key === 'D') processarMovimento('direita');
            }
        }, { passive: false });

        let toqueInicialX = 0, toqueInicialY = 0;
        
        elementos.containerTabuleiro.addEventListener('touchstart', evento => {
            toqueInicialX = evento.changedTouches[0].screenX;
            toqueInicialY = evento.changedTouches[0].screenY;
        }, { passive: true });

        elementos.containerTabuleiro.addEventListener('touchend', evento => {
            if(!elementos.telaInicial.classList.contains('escondido')) return;
            
            let toqueFinalX = evento.changedTouches[0].screenX;
            let toqueFinalY = evento.changedTouches[0].screenY;
            
            let diferencaX = toqueFinalX - toqueInicialX;
            let diferencaY = toqueFinalY - toqueInicialY;
            
            if (Math.abs(diferencaX) < 30 && Math.abs(diferencaY) < 30) return;

            if (Math.abs(diferencaX) > Math.abs(diferencaY)) {
                diferencaX > 0 ? processarMovimento('direita') : processarMovimento('esquerda');
            } else {
                diferencaY > 0 ? processarMovimento('baixo') : processarMovimento('cima');
            }
        }, { passive: true });
