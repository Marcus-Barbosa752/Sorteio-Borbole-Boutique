const InserirParticipantes = document.getElementById("InserirParticipantes")
const BtnAdicionar = document.getElementById("BtnAdicionar")
const BtnSorteiar = document.getElementById("BtnSorteiar")
const BtnFecharSorteiar = document.getElementById("BtnFecharSorteiar")
const InputNovoParticipantesHome = document.getElementById("InputNovoParticipantesHome")
const RandomicoParticipantes = document.querySelector(".RandomicoParticipantes")
const ExibirParticipantes = document.querySelector(".ExibirParticipantes")

const CHAVE_STORAGE = "ListaParticipantes"
const CAMINHO_IMAGEM_CONFETE = "Assets/Image/Logo_Borbole_Boutique.png"

let Participantes = []
let IndexEmEdicao = null // guarda qual participante está sendo editado no momento

// ==========================================
// CARDS DE PARTICIPANTES
// ==========================================
const CriarCard = ({ Quantidade, Nome, Index }) => {
    return `
    <div class="CardUsuario">
        <h4>${Quantidade} <span>${Nome}</span></h4>
        <nav>
            <button data-acao="editar" data-index="${Index}"><i class="fi fi-sr-user-pen"></i> <span>Editar</span></button>
            <button data-acao="deletar" data-index="${Index}"><i class="fi fi-sr-cross"></i> <span>Deletar</span></button>
        </nav>
    </div>
    `
}

const SalvarNoStorage = () => {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(Participantes))
}

const CarregarDoStorage = () => {
    const Dados = localStorage.getItem(CHAVE_STORAGE)
    Participantes = Dados ? JSON.parse(Dados) : []
}

const CarregarNovosParticipantes = () => {
    InserirParticipantes.innerHTML = ""
    Participantes.forEach((Pessoa, Index) => {
        InserirParticipantes.innerHTML += CriarCard({ Quantidade: Index + 1, Nome: Pessoa.Nome, Index })
    })
}

const VerificarDigitoInput = ({ Canpo }) => {
    if (!Canpo.value) {
        alert("PREENCHA O CANPO DE NOVO PARTICIPANTE ANTES DE ADICIONAR!")
        return false
    }
    return true
}

const VerificarUsuarioExistente = ({ Nome, IgnorarIndex = null }) => {
    return Participantes.some((Pessoa, Index) => {
        if (IgnorarIndex !== null && Index === IgnorarIndex) return false
        return Pessoa.Nome === Nome
    })
}

const DeletarParticipante = (Index) => {
    const Pessoa = Participantes[Index]
    if (!confirm(`Deseja realmente remover "${Pessoa.Nome}"?`)) return

    Participantes.splice(Index, 1)
    SalvarNoStorage()
    CarregarNovosParticipantes()
}

const EditarParticipante = (Index) => {
    const Pessoa = Participantes[Index]

    InputNovoParticipantesHome.value = Pessoa.Nome
    InputNovoParticipantesHome.focus()

    IndexEmEdicao = Index
    BtnAdicionar.textContent = "Salvar Edição"
}

BtnAdicionar.onclick = () => {
    if (!VerificarDigitoInput({ Canpo: InputNovoParticipantesHome })) return

    const NomeDigitado = InputNovoParticipantesHome.value

    if (VerificarUsuarioExistente({ Nome: NomeDigitado, IgnorarIndex: IndexEmEdicao })) {
        alert("ESSE PARTICIPANTE JÁ FOI ADICIONADO!")
        return
    }

    if (IndexEmEdicao !== null) {
        Participantes[IndexEmEdicao].Nome = NomeDigitado
        IndexEmEdicao = null
        BtnAdicionar.textContent = "Adicionar"
    } else {
        Participantes.push({ Nome: NomeDigitado })
    }

    SalvarNoStorage()

    InputNovoParticipantesHome.value = ""
    InputNovoParticipantesHome.focus()
    CarregarNovosParticipantes()
}

// Delegação de eventos: um único listener cuida de todos os botões Editar/Deletar,
// mesmo os que ainda vão ser criados no futuro
InserirParticipantes.addEventListener("click", (Evento) => {
    const Botao = Evento.target.closest("button")
    if (!Botao) return

    const Acao = Botao.dataset.acao
    const Index = Number(Botao.dataset.index)

    if (Acao === "deletar") DeletarParticipante(Index)
    if (Acao === "editar") EditarParticipante(Index)
})

// ==========================================
// SONS (Web Audio API)
// ==========================================

const AudioContexto = new (window.AudioContext || window.webkitAudioContext)()

const TocarTique = () => {
    const Oscilador = AudioContexto.createOscillator()
    const Volume = AudioContexto.createGain()

    Oscilador.connect(Volume)
    Volume.connect(AudioContexto.destination)

    Oscilador.type = "square"
    Oscilador.frequency.value = 800

    const TempoInicio = AudioContexto.currentTime
    const TempoFim = TempoInicio + 0.05

    Volume.gain.setValueAtTime(0.15, TempoInicio)
    Volume.gain.exponentialRampToValueAtTime(0.001, TempoFim)

    Oscilador.start(TempoInicio)
    Oscilador.stop(TempoFim)
}

const TocarSomVencedor = () => {
    const Notas = [523.25, 659.25, 783.99, 1046.50] // Dó, Mi, Sol, Dó (oitava acima)

    Notas.forEach((Frequencia, Index) => {
        const Oscilador = AudioContexto.createOscillator()
        const Volume = AudioContexto.createGain()

        Oscilador.connect(Volume)
        Volume.connect(AudioContexto.destination)

        Oscilador.type = "triangle"
        Oscilador.frequency.value = Frequencia

        const TempoInicio = AudioContexto.currentTime + Index * 0.12
        const TempoFim = TempoInicio + 0.3

        Volume.gain.setValueAtTime(0, TempoInicio)
        Volume.gain.linearRampToValueAtTime(0.3, TempoInicio + 0.02)
        Volume.gain.exponentialRampToValueAtTime(0.001, TempoFim)

        Oscilador.start(TempoInicio)
        Oscilador.stop(TempoFim)
    })
}

// ==========================================
// CONFETE DE BORBOLETAS (Canvas)
// ==========================================

const CanvasConfete = document.createElement("canvas")
CanvasConfete.style.position = "absolute"
CanvasConfete.style.top = "0"
CanvasConfete.style.left = "0"
CanvasConfete.style.pointerEvents = "none"
RandomicoParticipantes.appendChild(CanvasConfete)

const ContextoConfete = CanvasConfete.getContext("2d")

const ImagemBorboleta = new Image()
ImagemBorboleta.src = CAMINHO_IMAGEM_CONFETE

let Borboletas = []
let AnimacaoConfeteAtiva = false

const AjustarTamanhoCanvas = () => {
    CanvasConfete.width = RandomicoParticipantes.offsetWidth
    CanvasConfete.height = RandomicoParticipantes.offsetHeight
}

const CriarBorboleta = () => {
    return {
        X: Math.random() * CanvasConfete.width,
        Y: -50 - Math.random() * 200,
        Tamanho: 20 + Math.random() * 20,
        VelocidadeQueda: 1 + Math.random() * 2,
        AnguloBalanco: Math.random() * Math.PI * 2,
        VelocidadeBalanco: 0.02 + Math.random() * 0.03,
        Rotacao: Math.random() * Math.PI * 2,
        VelocidadeRotacao: (Math.random() - 0.5) * 0.05
    }
}

const DesenharBorboleta = (Borboleta) => {
    ContextoConfete.save()
    ContextoConfete.translate(Borboleta.X, Borboleta.Y)
    ContextoConfete.rotate(Borboleta.Rotacao)
    ContextoConfete.drawImage(
        ImagemBorboleta,
        -Borboleta.Tamanho / 2,
        -Borboleta.Tamanho / 2,
        Borboleta.Tamanho,
        Borboleta.Tamanho
    )
    ContextoConfete.restore()
}

const AtualizarBorboleta = (Borboleta) => {
    Borboleta.Y += Borboleta.VelocidadeQueda
    Borboleta.AnguloBalanco += Borboleta.VelocidadeBalanco
    Borboleta.X += Math.sin(Borboleta.AnguloBalanco) * 1.5
    Borboleta.Rotacao += Borboleta.VelocidadeRotacao
}

const RodarAnimacaoConfete = () => {
    ContextoConfete.clearRect(0, 0, CanvasConfete.width, CanvasConfete.height)

    Borboletas.forEach(AtualizarBorboleta)
    Borboletas.forEach(DesenharBorboleta)

    Borboletas = Borboletas.filter(Borboleta => Borboleta.Y < CanvasConfete.height + 50)

    if (AnimacaoConfeteAtiva && Borboletas.length > 0) {
        requestAnimationFrame(RodarAnimacaoConfete)
    } else {
        ContextoConfete.clearRect(0, 0, CanvasConfete.width, CanvasConfete.height)
    }
}

const IniciarConfete = () => {
    AjustarTamanhoCanvas()

    const QuantidadeBorboletas = 40
    Borboletas = Array.from({ length: QuantidadeBorboletas }, CriarBorboleta)

    AnimacaoConfeteAtiva = true
    setTimeout(() => { AnimacaoConfeteAtiva = false }, 6000)

    RodarAnimacaoConfete()
}

// ==========================================
// SORTEIO
// ==========================================

const RolarAteTopo = () => {
    if (innerWidth <= 900) {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        })
    }
}

BtnSorteiar.onclick = () => {
    if (Participantes.length === 0) {
        alert("ADICIONE AO MENOS UM PARTICIPANTE PARA SORTEAR!")
        return
    }

    RolarAteTopo()  

    if (AudioContexto.state === "suspended") AudioContexto.resume()

    RandomicoParticipantes.style.display = "block"
    BtnSorteiar.disabled = true

    const IndiceSorteado = Math.floor(Math.random() * Participantes.length)
    const PessoaSorteada = Participantes[IndiceSorteado]

    let ContagemVoltas = 0
    const TotalVoltas = 35
    let VelocidadeAtual = 60

    const RodarEfeito = () => {
        const IndiceAleatorio = Math.floor(Math.random() * Participantes.length)
        ExibirParticipantes.textContent = Participantes[IndiceAleatorio].Nome

        TocarTique()

        ContagemVoltas++

        if (ContagemVoltas < TotalVoltas) {
            VelocidadeAtual += 20
            setTimeout(RodarEfeito, VelocidadeAtual)
        } else {
            ExibirParticipantes.textContent = PessoaSorteada.Nome
            TocarSomVencedor()
            IniciarConfete()
            BtnSorteiar.disabled = false
        }
    }

    RodarEfeito()
}

BtnFecharSorteiar.onclick = () => RandomicoParticipantes.style.display = "none"

// ==========================================
// INICIALIZAÇÃO
// ==========================================

CarregarDoStorage()
CarregarNovosParticipantes()