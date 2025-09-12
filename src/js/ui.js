import { FormulaireFactory } from "./formulaireFactory";
import { config } from "./config";
import { DBManager } from "./db";
import { afficherMessage, calculerRecetteParTransactions } from "./utils";
import { afficherPaniersClient } from "./tableauFactory";

export function boutonAdd(obj, contexte) {
  const btnNouveau = document.createElement("button");
  btnNouveau.innerHTML = "+";
  btnNouveau.className = "btn-flottant";
  btnNouveau.title = contexte;
  btnNouveau.dataset.code = obj.id || "";
  if (contexte === "transaction") {
    document.getElementById("lateral").appendChild(btnNouveau);
  } else {
    document.body.appendChild(btnNouveau);
  }

  // =======================Le bouton add du volet lateral ======================
  btnNouveau.addEventListener("click", async () => {
    const zoneFormulaire = document.getElementById("fieldset");

    Array.from(zoneFormulaire.children).forEach(child => {
      if (child.tagName !== "LEGEND") {
        child.remove();
      }
    });
    if (contexte != "transaction") {
      zoneFormulaire.classList.remove("notshow");
    } else {
      zoneFormulaire.classList.add("notshow");
      document.getElementById("tableau").innerHTML = ""
      const btnFlottant = document.querySelector("body > .btn-flottant");
      if (btnFlottant) btnFlottant.remove();

    }
    document.getElementById("frm_entite").innerHTML = `Formulaire : ${contexte}`;
    const formFactory = new FormulaireFactory(config);
    // Cas particulier pour "transaction"
    btnNouveau.remove();

    if (contexte === "transaction") {
      const ob = { code: obj.id, montant: "", avance: "", balance: "" }
      await DBManager.add("panier", ob) // 👈 await ici, attendre que le panier soit ajouté avant de rafraîchir la liste

      afficherPaniersClient(obj.id);

    } else {
      // Pour partenaire, produit, paiement
      const form = await formFactory.creerFormulaire(contexte, async (data) => {
        await DBManager.add(contexte, data);
        afficherMessage(`✅${contexte} enregistré.`);
        afficherTableau(contexte);
      });
      zoneFormulaire.appendChild(form);
    }
  });
}

export async function afficherFormulaireLivraison(transaction) {
  const formFactory = new FormulaireFactory(config);
  const zoneFormulaire = document.getElementById("fieldset");

  // Nettoyer
  Array.from(zoneFormulaire.children).forEach(child => {
    if (child.tagName !== "LEGEND") child.remove();
  });
  zoneFormulaire.classList.remove("notshow");
  document.getElementById("frm_entite").textContent = "Formulaire de livraison";

  // Créer formulaire
  const form = await formFactory.creerFormulaire("livraison", async (data) => {
    await DBManager.add("livraison", data);
    afficherMessage("🚚 Livraison enregistrée.");
    // Tu peux ici rafraîchir le tableau de livraison
  });

  // Pré-remplir champs
  form.elements["produit"].value = transaction.produit;
  form.elements["panier"].value = transaction.panier;
  form.elements["date"].value = new Date().toISOString().split("T")[0];

  zoneFormulaire.appendChild(form);
}

export async function afficherRapport(rapport,zone) {

  zone.innerHTML = ""; // Nettoie l'ancien contenu
   const table = document.createElement("table");


  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Période</th>
      <th>Achat (GHT)</th>
      <th>Recette (GHT)</th>
      <th>Encaissement (GHT)</th>
      <th>Balance (GHT)</th>
    </tr>
  `;

  const tbody = document.createElement("tbody");

  const nomsPeriodes = {
    today: "Aujourd'hui",
    moisCourant: "Mois courant",
    moisDernier: "Mois dernier",
  };

  for (const periode of ["today", "moisCourant", "moisDernier"]) {
    const data = rapport[periode];
    const tr = document.createElement("tr");
    const vente = await calculerRecetteParTransactions(periode)
    const balance = vente - data.encaissement;

    const rem = (balance>vente*0.25) ? 'class="danger"' : 'class="warning"';

    tr.innerHTML = `
      <td class="link">${nomsPeriodes[periode]}</td>
      <td class="danger">${data.achat.toLocaleString()}</td>
      <td class="info">${vente.toLocaleString()}</td>
      <td class="success">${data.encaissement.toLocaleString()}</td>
      <td ${rem}>${balance.toLocaleString()}</td>
    `;

    tbody.appendChild(tr);
  }
  table.appendChild(thead);
  table.appendChild(tbody);
  zone.appendChild(table);
}

export function afficherEtatStock(etat,contenair ) {
  const zone = document.getElementById("formulaire");
  // zone.innerHTML = "";
  zone.classList.remove("triple");
  document.getElementById("frm_entite").innerHTML = "Etat de stock"

  const table = document.createElement("table");
  table.className = "etat-stock";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Matériaux</th>
      <th>Réception</th>
      <th>Vente</th>
      <th>Reste</th>
    </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  etat.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.materiaux}</td>
      <td>${item.reception}</td>
      <td>${item.vente}</td>
      <td>${item.reste}</td>`;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  contenair.appendChild(table);
}

export function afficherTableauClients(donnees,zone) {
  // const zone = document.getElementById("table-zone");
  zone.innerHTML = "";

  const table = document.createElement("table");
  table.classList.add("styled-table");

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Nom</th>
      <th>Prénom</th>
      <th>Téléphone</th>
      <th>Dernière date</th>
      <th>Achat</th>
      <th>Avance</th>
      <th>Balance</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  
  donnees.forEach(c => {
    const tr = document.createElement("tr");
    const rem = (c.balance>c.achat*0.25) ? 'class="danger"' : 'class="warning"';
    tr.innerHTML = `
      <td>${c.nom}</td>
      <td>${c.prenom}</td>
      <td>${c.telephone}</td>
      <td>${c.date || "-"}</td>
      <td>${c.achat.toLocaleString()} GHT</td>
      <td>${c.avance.toLocaleString()} GHT</td>
      <td ${rem}>${c.balance.toLocaleString()} GHT</td>
    `;
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  zone.appendChild(table);
}

