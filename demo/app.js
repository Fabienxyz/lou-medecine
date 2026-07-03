    const tabs = document.querySelectorAll(".tab");
    const content = document.querySelector(".content");
    
    const pages = [
    `
    <h2>📖 Histoire</h2>

    <p>Imagine une autoroute parfaitement fluide : l'endothélium artériel est lisse, les lipoprotéines circulent sans s'accumuler, le flux sanguin est régulier. Pendant des décennies, rien ne semble se passer.</p>

    <p>Puis, année après année, de petites agressions s'additionnent — tabac, hypertension, diabète, dyslipidémie. L'endothélium devient perméable. Les LDL pénètrent dans la paroi artérielle et s'y accumulent.</p>

    <h2>La naissance silencieuse d'une lésion</h2>

    <p>Ce n'est pas une rupture brutale. C'est une lente transformation :</p>

    <ul>
        <li>Les LDL oxydées déclenchent une réaction inflammatoire locale</li>
        <li>Les monocytes migrent et se transforment en macrophages</li>
        <li>Ces macrophages phagocytent les lipides et deviennent des cellules moussues</li>
        <li>La lésion grossit, formant une strie grasse puis une plaque fibro-lipidique</li>
    </ul>

    <blockquote>
        <p>L'athérosclérose est une maladie chronique qui commence souvent dans la vingtaine, bien avant tout symptôme clinique.</p>
    </blockquote>

    <hr>

    <h2>Chronologie d'une plaque</h2>

    <table>
        <thead>
            <tr>
                <th>Phase</th>
                <th>Ce qui se passe</th>
                <th>Conséquence</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Strie grasse</td>
                <td>Accumulation de lipides sous l'endothélium</td>
                <td>Lésion réversible, souvent asymptomatique</td>
            </tr>
            <tr>
                <td>Plaque fibro-lipidique</td>
                <td>Cap fibreux + nécrobiose lipidique centrale</td>
                <td>Rétrécissement progressif de la lumière</td>
            </tr>
            <tr>
                <td>Plaque instable</td>
                <td>Cap mince, inflammation intense</td>
                <td>Risque de rupture et thrombose aiguë</td>
            </tr>
        </tbody>
    </table>

    <div class="footer-nav">
        <button class="nav-btn">← Concept précédent</button>
        <button class="nav-btn primary">Concept suivant →</button>
    </div>
    `,
    `
    <h2>❓ Pourquoi ?</h2>

    <p>Comprendre l'athérosclérose, ce n'est pas mémoriser une liste de facteurs de risque. C'est saisir pourquoi une lésion silencieuse peut, un matin, provoquer un infarctus.</p>

    <h2>Pourquoi cette lésion est-elle si fréquente ?</h2>

    <p>Les artères de gros calibre subissent des contraintes permanentes. L'intima est le premier contact avec le sang — et avec ses lipoprotéines. Dès que l'endothélium dysfonctionne, la paroi devient un site d'accumulation.</p>

    <ol>
        <li>Perméabilité endothéliale accrue → entrée des LDL</li>
        <li>Oxydation des LDL → signal pro-inflammatoire</li>
        <li>Recrutement immunitaire → inflammation chronique</li>
        <li>Prolifération fibroblastique → formation du cap fibreux</li>
    </ol>

    <blockquote>
        <p>On ne traite pas seulement un rétrécissement artériel : on traite une maladie inflammatoire chronique de la paroi vasculaire.</p>
    </blockquote>

    <hr>

    <h2>Pourquoi certaines plaques deviennent dangereuses ?</h2>

    <table>
        <thead>
            <tr>
                <th>Plaque stable</th>
                <th>Plaque instable</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Cap fibreux épais</td>
                <td>Cap mince et fragile</td>
            </tr>
            <tr>
                <td>Petite nécrobiose centrale</td>
                <td>Large cœur lipidique/nécrotique</td>
            </tr>
            <tr>
                <td>Peu d'inflammation</td>
                <td>Inflammation active (macrophages, lymphocytes)</td>
            </tr>
            <tr>
                <td>Sténose progressive</td>
                <td>Rupture → thrombose occlusive aiguë</td>
            </tr>
        </tbody>
    </table>

    <p>C'est cette distinction qui explique pourquoi un patient peut avoir une coronaropathie sévère sans infarctus — ou subir un infarctus sur une lésion modérément sténosante mais instable.</p>

    <div class="footer-nav">
        <button class="nav-btn">← Concept précédent</button>
        <button class="nav-btn primary">Concept suivant →</button>
    </div>
    `,
    `
    <h2>🗺️ Vue d'ensemble</h2>

    <p>
    Avant d'entrer dans les détails, prends une minute pour visualiser tout le mécanisme.
    L'objectif n'est pas de retenir chaque étape mais de comprendre le film dans son ensemble.
    </p>

    <div style="
    margin:32px 0;
    background:white;
    border-radius:18px;
    padding:8px;
    ">

    <img
    src="assets/svg/cardio-221-overview.svg"
    alt="Formation d'une plaque d'athérome"
    style="
    width:100%;
    height:auto;
    display:block;
    ">

    </div>

    <blockquote>
    <p>
    Toutes les complications (infarctus, AVC, AOMI) proviennent du même mécanisme.
    Le territoire atteint est la seule différence.
    </p>
    </blockquote>

    <div class="footer-nav">
        <button class="nav-btn">← Concept précédent</button>
        <button class="nav-btn primary">Concept suivant →</button>
    </div>
    `,
    `
    <h2>🔬 Les acteurs</h2>

    <p>Zoom sur les cellules et molécules qui construisent — ou déstabilisent — la plaque. Chaque acteur a un rôle précis dans la cascade athérogène.</p>

    <h2>Endothélium</h2>

    <p>Barrière sélective entre le sang et la paroi. En cas de dysfonction, il exprime des molécules d'adhésion (VCAM-1, ICAM-1) qui recrutent les monocytes et favorisent l'entrée des LDL.</p>

    <h2>Macrophages et cellules moussues</h2>

    <p>Les monocytes infiltrés se différencient en macrophages. Ils internalisent les LDL oxydées via les récepteurs scavenger (SR-A, CD36), sans régulation par feedback négatif. Résultat : accumulation de cholestérol estérifie → cellules moussues.</p>

    <hr>

    <h2>Tableau des acteurs biologiques</h2>

    <table>
        <thead>
            <tr>
                <th>Acteur</th>
                <th>Rôle principal</th>
                <th>Conséquence si activé</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>LDL oxydées</td>
                <td>Déclencheur inflammatoire</td>
                <td>Recrutement macrophagique</td>
            </tr>
            <tr>
                <td>Macrophages</td>
                <td>Phagocytose des lipides</td>
                <td>Cellules moussues, nécrobiose</td>
            </tr>
            <tr>
                <td>Cellules musculaires lisses</td>
                <td>Synthèse du cap fibreux</td>
                <td>Stabilisation ou sténose</td>
            </tr>
            <tr>
                <td>Lymphocytes T</td>
                <td>Immunité adaptative locale</td>
                <td>Amplification de l'inflammation</td>
            </tr>
            <tr>
                <td>Métalloprotéinases (MMP)</td>
                <td>Dégradation de la matrice</td>
                <td>Affinement du cap → instabilité</td>
            </tr>
        </tbody>
    </table>

    <blockquote>
        <p>La rupture de plaque n'est pas un accident : c'est l'équilibre rompu entre stabilisation (cap fibreux) et dégradation (MMP, inflammation).</p>
    </blockquote>

    <h2>Thrombose : l'étape finale</h2>

    <p>Quand le cap se rompt, le collagène sous-endothélial entre en contact avec le sang. L'activation plaquettaire et la cascade de coagulation produisent un thrombus occlusif — en quelques minutes.</p>

    <div class="footer-nav">
        <button class="nav-btn">← Concept précédent</button>
        <button class="nav-btn primary">Concept suivant →</button>
    </div>
    `,
    `
    <h2>🎯 Suis-je prêt ?</h2>

    <p>Avant de passer au concept suivant, vérifie que tu peux répondre à ces questions sans relire tes notes.</p>

    <h2>Questions de compréhension</h2>

    <ol>
        <li>Quel est le rôle de l'endothélium dans la genèse de la plaque ?</li>
        <li>Pourquoi les macrophages deviennent-ils des cellules moussues ?</li>
        <li>Quelle différence distingue une plaque stable d'une plaque instable ?</li>
        <li>Pourquoi une sténose modérée peut-elle provoquer un infarctus ?</li>
        <li>Cite trois territoires cliniques de l'athérosclérose et leur complication.</li>
    </ol>

    <hr>

    <h2>Points clés à retenir</h2>

    <ul>
        <li>L'athérosclérose = inflammation chronique de la paroi + accumulation lipidique</li>
        <li>La complication aiguë vient de la rupture et de la thrombose, pas seulement de la sténose</li>
        <li>Les facteurs de risque accélèrent la dysfonction endothéliale</li>
    </ul>

    <blockquote>
        <p>Si tu peux expliquer ce mécanisme à un camarade en cinq minutes, tu as compris l'essentiel. La mémorisation viendra ensuite, presque toute seule.</p>
    </blockquote>

    <table>
        <thead>
            <tr>
                <th>Critère</th>
                <th>Tu es prêt si…</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Mécanisme de formation</td>
                <td>Tu peux le raconter comme une histoire, étape par étape</td>
            </tr>
            <tr>
                <td>Instabilité</td>
                <td>Tu identifies cap mince, inflammation, MMP</td>
            </tr>
            <tr>
                <td>Lien clinique</td>
                <td>Tu fais le lien plaque → thrombose → IDM / AVC / AOMI</td>
            </tr>
        </tbody>
    </table>

    <div class="footer-nav">
        <button class="nav-btn">← Concept précédent</button>
        <button class="nav-btn primary">Concept suivant →</button>
    </div>
    `
    ];
    
    let currentTab = 0;

    function showTab(index) {
        if (index < 0 || index >= tabs.length) return;
        currentTab = index;
        tabs.forEach(t => t.classList.remove("active"));
        tabs[index].classList.add("active");
        content.style.animation = "none";
        content.offsetHeight;
        content.style.animation = "";
        content.innerHTML = pages[index];
    }

    tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => showTab(index));
    });

    content.addEventListener("click", (e) => {
        const btn = e.target.closest(".nav-btn");
        if (!btn) return;
        if (btn.classList.contains("primary")) {
            showTab(currentTab + 1);
        } else {
            showTab(currentTab - 1);
        }
    });
