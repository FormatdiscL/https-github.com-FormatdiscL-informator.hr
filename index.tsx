import { GoogleGenAI } from "@google/genai";

// This will make functions available on the window object for inline event handlers
declare global {
    interface Window {
        handlePredefinedChat: (question: string) => void;
        calculateAlimentacijaFromBot: () => void;
    }
}

// --- MOCK DATA ---
const mockLaws = [
     {
        id: 'kazneni_zakon',
        title: 'Kazneni zakon',
        category: 'Kazneno pravo',
        publication_date: 'NN 125/11, 144/12, 56/15, 61/15, 101/17',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20.618 5.984A2.25 2.25 0 0118.868 8H5.132a2.25 2.25 0 01-1.75-2.016l.51-6.115A2.25 2.25 0 016.132 0h11.736a2.25 2.25 0 012.24 1.869l.51 6.115z" /><path stroke-linecap="round" stroke-linejoin="round" d="M3.375 8A1.875 1.875 0 001.5 9.875v11.25A1.875 1.875 0 003.375 23h17.25A1.875 1.875 0 0022.5 21.125V9.875A1.875 1.875 0 0020.625 8H3.375z" /></svg>',
        content: 'Članak 191. (1) Tko neovlašteno posjeduje, drži ili na bilo koji način skriva tvari ili pripravke koji su propisom proglašeni opojnim drogama, kaznit će se za prekršaj novčanom kaznom od 660,00 do 2.650,00 eura. (2) Ako je količina droge mala i namijenjena isključivo za osobnu uporabu, počinitelj se može osloboditi kazne. (3) Tko neovlašteno proizvodi, prerađuje, prodaje ili nudi na prodaju tvari ili pripravke koji su proglašeni opojnim drogama, ili tko u tu svrhu kupuje, posjeduje ili prenosi te tvari, kaznit će se kaznom zatvora od jedne do dvanaest godina.',
        contact: { institution: 'Ministarstvo pravosuđa i uprave', email: 'info@mpu.hr', phone: '01 3714 000' },
        keywords: ['droga', 'opijati', 'posjedovanje', 'trava', 'kokain', 'heroin', 'spid', 'speed', 'amfetamin', 'žuto', 'kazna', 'grama', '20', 'pao']
    },
    {
        id: 'zakon_o_zastiti_od_nasilja_u_obitelji',
        title: 'Zakon o zaštiti od nasilja u obitelji',
        category: 'Prekršajno pravo',
        publication_date: 'NN 70/17, 126/19, 84/21',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>',
        content: 'Članak 10. Nasilje u obitelji je: (1) tjelesno nasilje, (2) psihičko nasilje koje je kod žrtve prouzročilo povredu dostojanstva ili uznemirenost, (3) spolno uznemiravanje, (4) ekonomsko nasilje kao zabrana ili ograničavanje raspolaganja novcem. Počinitelj nasilja u obitelji kaznit će se novčanom kaznom od najmanje 920,00 eura ili kaznom zatvora do 90 dana.',
        contact: { institution: 'Ministarstvo rada, mirovinskoga sustava, obitelji i socijalne politike', email: 'info@mrms.hr', phone: '01 6106 310' },
        keywords: ['nasilje', 'obitelj', 'zlostavljanje', 'uznemiravanje', 'tjelesno', 'psihičko']
    },
    {
        id: 'zakon_o_oruzju',
        title: 'Zakon o nabavi i posjedovanju oružja građana',
        category: 'Prekršajno pravo',
        publication_date: 'NN 94/18, 42/20',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h.5A2.5 2.5 0 0021.5 5.5V3.935m-18 0A2.25 2.25 0 013.75 2h16.5a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0120.25 22H3.75A2.25 2.25 0 011.5 19.75V3.935z" /></svg>',
        content: 'Članak 71. (1) Tko neovlašteno nabavi, drži, nosi, izrađuje, prodaje ili na drugi način stavi u promet vatreno oružje, streljivo, bitne dijelove oružja ili prigušivače, kaznit će se kaznom zatvora od šest mjeseci do pet godina. (2) Posebno teški oblici ovog djela, ako se odnose na veće količine oružja ili su počinjeni od strane grupe, kažnjavaju se strože.',
        contact: { institution: 'Ministarstvo unutarnjih poslova (MUP)', email: 'pitanja@mup.hr', phone: '01 3788 111' },
        keywords: ['oružje', 'utoka', 'pimpać', 'pištolj', 'puška', 'neovlašteno', 'dozvola']
    }
];

// --- DOM Elements ---
const searchInput = document.getElementById('searchInput') as HTMLInputElement;
const searchButton = document.getElementById('searchButton') as HTMLButtonElement;
const resultsContainer = document.getElementById('resultsContainer') as HTMLElement;
const initialMessage = document.getElementById('initialMessage') as HTMLElement;
const loader = document.getElementById('loader') as HTMLElement;
const buttonText = document.getElementById('buttonText') as HTMLElement;
const suggestionsContainer = document.getElementById('suggestionsContainer') as HTMLElement;
const searchView = document.getElementById('searchView') as HTMLElement;
const chatView = document.getElementById('chatView') as HTMLElement;
const tabSearch = document.getElementById('tabSearch') as HTMLButtonElement;
const tabChat = document.getElementById('tabChat') as HTMLButtonElement;
const chatWindow = document.getElementById('chatWindow') as HTMLElement;
const chatInput = document.getElementById('chatInput') as HTMLInputElement;
const chatSendButton = document.getElementById('chatSendButton') as HTMLButtonElement;
const historyContainer = document.getElementById('historyContainer') as HTMLElement;

const categoryColors: { [key: string]: string } = {
    'Radno pravo': 'bg-blue-100 text-blue-800',
    'Prekršajno pravo': 'bg-orange-100 text-orange-800',
    'Kazneno pravo': 'bg-gray-200 text-gray-800'
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function callGemini(prompt: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        const text = response.text;
        if (text) {
            return text;
        }
        console.error("Unexpected API response structure:", response);
        return "Nije moguće dobiti odgovor od AI. Struktura odgovora je neočekivana.";
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "Došlo je do greške prilikom komunikacije s AI. Molimo pokušajte ponovno.";
    }
}

function renderResults(filteredLaws: typeof mockLaws, searchTerm = '') {
    if(resultsContainer) resultsContainer.innerHTML = '';
    if (initialMessage) initialMessage.style.display = 'none';

    if (filteredLaws.length === 0) {
        if(resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="text-center py-16 px-6 bg-white rounded-2xl border border-gray-200 result-card">
                     <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h3 class="text-xl font-semibold text-gray-700 mt-4">Nema rezultata</h3>
                    <p class="text-gray-500 mt-2">Nismo pronašli zakone za unesene kriterije.</p>
                </div>
            `;
        }
    } else {
        filteredLaws.forEach(law => {
            const resultCard = document.createElement('div');
            resultCard.className = 'bg-white p-6 rounded-2xl border border-gray-200 result-card';
            resultCard.dataset.content = law.content;
            
            const regex = searchTerm ? new RegExp(searchTerm.split(' ').filter(k=>k.length > 1).join('|'), 'gi') : null;
            const highlightedContent = regex ? law.content.replace(regex, (match) => `<mark class="highlight">${match}</mark>`) : law.content;
            const highlightedTitle = regex ? law.title.replace(regex, (match) => `<mark class="highlight">${match}</mark>`) : law.title;

            resultCard.innerHTML = `
                <div class="flex items-start justify-between mb-3">
                    <span class="category-tag ${categoryColors[law.category] || 'bg-gray-100 text-gray-800'}">${law.category}</span>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-1">${highlightedTitle}</h3>
                <p class="text-xs text-gray-400 mb-4">${law.publication_date}</p>
                <p class="text-gray-600 leading-relaxed">${highlightedContent}</p>
            `;
            
            if(resultsContainer) resultsContainer.appendChild(resultCard);
        });
    }
}

const performSearch = () => {
    if(suggestionsContainer) suggestionsContainer.classList.add('hidden');
    let searchTerm = searchInput.value.trim().toLowerCase();
    
    if(buttonText) buttonText.classList.add('hidden');
    if(loader) loader.classList.remove('hidden');
    if(searchButton) searchButton.disabled = true;

    let searchKeywords = searchTerm.split(' ').filter(k => k.length > 1); 

    if (searchTerm) {
        saveSearchToHistory(searchTerm);
        renderSearchHistory();
    }

    setTimeout(() => {
        const filteredLaws = mockLaws.filter(law => {
            const fullText = (law.title + ' ' + law.content + ' ' + law.category + ' ' + (law.keywords || []).join(' ')).toLowerCase();
            return searchKeywords.every(keyword => fullText.includes(keyword));
        });
        renderResults(filteredLaws, searchTerm);
        
        if(buttonText) buttonText.classList.remove('hidden');
        if(loader) loader.classList.add('hidden');
        if(searchButton) searchButton.disabled = false;
    }, 300); 
};

const handleInput = () => {
    const searchTerm = searchInput.value.trim().toLowerCase();
    if(suggestionsContainer) suggestionsContainer.innerHTML = '';
    if (!searchTerm) {
        if(suggestionsContainer) suggestionsContainer.classList.add('hidden');
        return;
    }
    const suggestions = mockLaws.filter(law => 
        law.title.toLowerCase().includes(searchTerm) ||
        law.category.toLowerCase().includes(searchTerm) ||
         (law.keywords && law.keywords.some(k => k.includes(searchTerm)))
    ).slice(0, 5);

    if (suggestions.length > 0) {
        suggestions.forEach(suggestion => {
            const item = document.createElement('div');
            item.className = 'p-4 cursor-pointer suggestion-item border-b border-gray-100 last:border-b-0';
            item.innerHTML = `<p class="font-semibold text-gray-800">${suggestion.title}</p><p class="text-sm text-gray-500">${suggestion.category}</p>`;
            item.onclick = () => {
                searchInput.value = suggestion.title;
                if(suggestionsContainer) suggestionsContainer.classList.add('hidden');
                performSearch();
            };
            if(suggestionsContainer) suggestionsContainer.appendChild(item);
        });
        if(suggestionsContainer) suggestionsContainer.classList.remove('hidden');
    } else {
        if(suggestionsContainer) suggestionsContainer.classList.add('hidden');
    }
};

const getSearchHistory = (): string[] => JSON.parse(localStorage.getItem('searchHistory') || '[]') as string[];

const saveSearchToHistory = (term: string) => {
    let history = getSearchHistory();
    history = history.filter(item => item !== term);
    history.unshift(term);
    localStorage.setItem('searchHistory', JSON.stringify(history.slice(0, 5)));
};

const renderSearchHistory = () => {
    const history = getSearchHistory();
    if (historyContainer) historyContainer.innerHTML = '';
    if (history.length > 0 && historyContainer) {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex flex-wrap items-center justify-center gap-2 mb-4';
        const label = document.createElement('span');
        label.className = 'text-sm font-semibold text-gray-500';
        label.textContent = 'Nedavne pretrage:';
        wrapper.appendChild(label);

        history.forEach(term => {
            const button = document.createElement('button');
            button.className = 'bg-gray-200 text-gray-700 text-sm font-semibold px-3 py-1 rounded-full hover:bg-gray-300';
            button.textContent = term;
            button.onclick = () => {
                searchInput.value = term;
                performSearch();
            };
            wrapper.appendChild(button);
        });
        historyContainer.appendChild(wrapper);
    }
};

async function callZakonBot(question: string) {
     if (question.toLowerCase().includes('kako sigurno prijaviti')) {
        return `💡 **AI-generiran odgovor (informativnog karaktera):** Ovaj tekst je generirala umjetna inteligencija i može sadržavati netočnosti. Nije zamjena za pravni savjet.<br><br>Prijavljivanje kriminala ili korupcije je važno. Evo sigurnih koraka:<br>1. **Ne dovodite se u opasnost.** Vaša sigurnost je na prvom mjestu.<br>2. **Prikupite dokaze:** Ako je moguće i sigurno, zabilježite vrijeme, mjesto, osobe i detalje događaja.<br>3. **Obratite se institucijama:** Prijavu možete podnijeti policiji (MUP) na broj 192, online putem aplikacije "e-Policija", ili PNUSKOK-u za složenije slučajeve korupcije. Prijave su anonimne.<br>4. **Potražite podršku:** Organizacije poput "Inicijative za transparentnost" mogu vam pružiti savjete.`
    } else if (question.toLowerCase().includes('kalkulator')) {
         return `Naravno, evo kalkulatora za alimentaciju. Molim vas unesite podatke. <div class="bg-white p-6 rounded-2xl border border-gray-200 mt-4"><h3 class="font-bold text-lg mb-4">Kalkulator alimentacije (Informativno)</h3><div class="space-y-4"><div><label for="netoPlaca" class="block text-sm font-medium text-gray-700">Prosječna mjesečna neto plaća roditelja</label><input type="number" id="netoPlaca" placeholder="Unesite iznos u EUR" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></div><div><label for="brojDjece" class="block text-sm font-medium text-gray-700">Broj djece za uzdržavanje</label><input type="number" id="brojDjece" placeholder="Unesite broj" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></div><button onclick="calculateAlimentacijaFromBot()" class="w-full bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-700">Izračunaj</button><div id="alimentacijaResultBot" class="mt-4 text-center font-bold text-xl"></div></div></div>`;
    }

    const allLawsContext = mockLaws.map(law => `Zakon: ${law.title}\nSadržaj: ${law.content}`).join('\n\n');
    const prompt = `Ti si "ZakonBot", napredni AI pravni asistent za Hrvatsku. Korisnik ti je postavio pitanje. Koristeći opće znanje o pravu i kontekst sljedećih zakona, pruži informativan i koristan odgovor.\n\nKONTEKST ZAKONA:\n${allLawsContext}\n\nKORISNIKOVO PITANJE: "${question}"\n\nOdgovori na hrvatskom jeziku. Tvoj odgovor mora započeti s ovom ogradom od odgovornosti: "💡 **AI-generiran odgovor (informativnog karaktera):** Ovaj tekst je generirala umjetna inteligencija i može sadržavati netočnosti. Nije zamjena za pravni savjet."`;
    
    const response = await callGemini(prompt);
    return response;
}

function addMessageToChat(message: string, sender: 'user' | 'ai') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-bubble ${sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`;
    messageDiv.innerHTML = message;
    if(chatWindow) chatWindow.appendChild(messageDiv);
    if(chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight; 
}

async function handleChatSend() {
    const question = chatInput.value.trim();
    if (!question) return;

    addMessageToChat(question, 'user');
    chatInput.value = '';

    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'chat-bubble chat-bubble-ai';
    loadingBubble.innerHTML = '<div class="gemini-loader"></div>';
    if(chatWindow) {
        chatWindow.appendChild(loadingBubble);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    const answer = await callZakonBot(question);
    loadingBubble.innerHTML = `<p class="font-bold">ZakonBot</p><p>${answer.replace(/\n/g, '<br>')}</p>`;
    if(chatWindow) chatWindow.scrollTop = chatWindow.scrollHeight;
}

window.calculateAlimentacijaFromBot = () => {
    const placaInput = document.getElementById('netoPlaca') as HTMLInputElement;
    const djecaInput = document.getElementById('brojDjece') as HTMLInputElement;
    const resultDiv = document.getElementById('alimentacijaResultBot') as HTMLElement;

    const placa = parseFloat(placaInput.value);
    const djeca = parseInt(djecaInput.value);
    
    if(resultDiv && (isNaN(placa) || isNaN(djeca) || placa <= 0 || djeca <=0)) {
        resultDiv.textContent = "Molimo unesite ispravne vrijednosti.";
        return;
    }
    const postotak = djeca === 1 ? 0.2 : (djeca === 2 ? 0.35 : 0.45);
    const iznos = (placa * postotak).toFixed(2);
    if(resultDiv) resultDiv.textContent = `Informativni izračun: ~ ${iznos} EUR`;
}

window.handlePredefinedChat = (question: string) => {
    chatInput.value = question;
    handleChatSend();
}

// --- Event Listeners ---
searchButton?.addEventListener('click', performSearch);
searchInput?.addEventListener('keydown', (event) => { if (event.key === 'Enter') { performSearch(); } });
searchInput?.addEventListener('input', handleInput);

chatSendButton?.addEventListener('click', handleChatSend);
chatInput?.addEventListener('keydown', (event) => { if (event.key === 'Enter') { handleChatSend(); } });

function switchTab(activeTab: HTMLElement, viewToShow: HTMLElement) {
     [tabSearch, tabChat].forEach(tab => {
        if(tab) {
            tab.classList.remove('border-blue-600', 'text-blue-600');
            tab.classList.add('border-transparent', 'text-gray-500');
        }
    });
    if(activeTab) {
        activeTab.classList.add('border-blue-600', 'text-blue-600');
        activeTab.classList.remove('border-transparent', 'text-gray-500');
    }
    
    [searchView, chatView].forEach(view => {
        if(view) view.style.display = 'none'
    });
    if(viewToShow) viewToShow.style.display = 'block';
}

tabSearch?.addEventListener('click', () => switchTab(tabSearch, searchView));
tabChat?.addEventListener('click', () => switchTab(tabChat, chatView));

// Initialize view
document.addEventListener('DOMContentLoaded', () => {
    renderSearchHistory();
});

export {};
