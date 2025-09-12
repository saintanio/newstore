import { afficherFormulaireLivraison, boutonAdd } from "./ui"
import { DBManager } from "./db";
import { FormulaireFactory } from "./formulaireFactory";
import { config } from "./config";
import { afficherMessage, calculerBalance } from "./utils";

export class TableauFactory {
  constructor(config, callbacks = {}) {
    this.config = config;
    this.onEdit = callbacks.onEdit || (() => { });
    this.onDelete = callbacks.onDelete || (() => { });
    this.onRefresh = callbacks.onRefresh; // 👈 nouvelle option
  }

  async creerTableau(nomStore, donnees) {
    const champs = this.config[nomStore];
let colonnes;

    if (nomStore === "stock") {
      colonnes = ["date", "designation", "quantite", "prix"];
    }else{
    colonnes = champs.map(f => f.name)
      .filter(nom => nom !== "panier" && nom !== "produit");
    }
    
  
    //produit
    const table = document.createElement("table");
    table.className = "tableau";

    // En-tête
    const thead = document.createElement("thead");
    const trHead = document.createElement("tr");
    colonnes.forEach(col => {
      const th = document.createElement("th");
      th.textContent = col;
      trHead.appendChild(th);
    });




    if (nomStore === "transaction") {
      trHead.appendChild(document.createElement("th")).textContent = "Designation";
      trHead.appendChild(document.createElement("th")).textContent = "Prix";
      trHead.appendChild(document.createElement("th")).textContent = "Montant";
    }

    trHead.appendChild(document.createElement("th")).textContent = "Actions";
    thead.appendChild(trHead);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    let total = 0;
    let produits = [];
    if (nomStore === "transaction" || nomStore === "stock") {
      produits = await DBManager.getAll("produit");
    }

    const { totalTransaction, totalPaiement, balance } = await calculerBalance(donnees[0]?.panier);

    donnees.forEach(obj => {
      const tr = document.createElement("tr");
      //=========================================================
if (nomStore === "stock") {
    const produit = produits.find(p => p.id === obj.produit);
    obj.designation = produit?.designation || "❓";
}
      //=========================================================
      colonnes.forEach(col => {
        const td = document.createElement("td");
        td.textContent = obj[col] ?? "";
        tr.appendChild(td);
      });



      // ================Details panier======================
      if (nomStore === "transaction") {
        const produit = produits.find(p => p.id === obj.produit);
        const pu = produit?.pu || 0;
        const designer = produit?.designation || "divers";
        const montant = pu * Math.abs(obj.quantite);

        const tdDesigner = document.createElement("td");
        tdDesigner.textContent = designer;
        tr.appendChild(tdDesigner);

        const tdPu = document.createElement("td");
        tdPu.textContent = pu.toLocaleString();
        tr.appendChild(tdPu);

        const tdMontant = document.createElement("td");
        tdMontant.textContent = montant.toLocaleString();
        tr.appendChild(tdMontant);

        total += montant;
      }

      const tdActions = document.createElement("td");
      const btnEdit = document.createElement("a");
      btnEdit.innerHTML = "&#128393;";
      btnEdit.style.marginLeft = "1rem"
      btnEdit.style.marginRight = "1rem"
      btnEdit.classList.add("action")


      btnEdit.addEventListener("click", async (e) => {
        e.stopPropagation(); // Empêche l'événement de remonter au <tr>

        this.onEdit(obj);

        if (nomStore === "transaction") {

          const panier = obj.panier;
          const paiements = await DBManager.getAllByIndex("paiements", "cartPaiement", panier);

          if (paiements.length > 0) {
            afficherMessage("❌ Transaction déjà payée, modification interdite.");
            return;
          }
        }
        if (typeof this.onRefresh === "function") {
          this.onRefresh();
        }

      });

      const btnDelete = document.createElement("a");
      btnDelete.textContent = "🗑";
      btnDelete.classList.add("action")

      btnDelete.addEventListener("click", async (e) => {
        e.stopPropagation(); // Idem

        if (nomStore === "partenaire") {
          const unused = await DBManager.peutSupprimerPartenaire(obj.id)
          if (unused) {
            const confirmDelete = confirm("❗ Voulez-vous vraiment supprimer cet élément ?");
            if (confirmDelete) {
              this.onDelete(obj);
              if (typeof this.onRefresh === "function") {
                this.onRefresh();
              }
            }
          } else {
            afficherMessage("Inviolable");
          }

        } else if (nomStore === "produit") {
          const unused = await DBManager.peutSupprimerProduit(obj.id)
          if (unused) {
            const confirmDelete = confirm("❗ Voulez-vous vraiment supprimer cet élément ?");
            if (confirmDelete) {
              this.onDelete(obj);
            }
          } else {
            afficherMessage("Inviolable");
          }

        } else if (nomStore === "transaction") {

          const panier = obj.panier;

          // Vérifie s'il existe un paiement pour ce panier
          const paiements = await DBManager.getAllByIndex("paiements", "cartPaiement", panier);

          if (paiements.length > 0) {
            afficherMessage("❌ Transaction déjà payée, suppression interdite.");
            return;
          }
          // Si pas de paiement, on autorise la suppression
          const confirmDelete = confirm("❗ Voulez-vous vraiment supprimer cet élément ?");
          if (confirmDelete) {

            await DBManager.delete(nomStore, obj.id);
            afficherTransactionsDuPanier(obj.panier);

          }

        }

      });

      if (nomStore === "transaction") {
        const btnLivrer = document.createElement("a");
        btnLivrer.textContent = "📦";
        btnLivrer.title = "Livrer";
        btnLivrer.classList.add("action");
        btnLivrer.addEventListener("click", () => afficherFormulaireLivraison(obj));
        tdActions.appendChild(btnLivrer);
      }

      tdActions.appendChild(btnEdit);

      tdActions.appendChild(btnDelete);
      tr.appendChild(tdActions);

      // Gérer sélection
      tr.addEventListener("click", () => {
        // Supprimer sélection existante
        [...tbody.querySelectorAll("tr")].forEach(r => r.classList.remove("selected-row"));
        tr.classList.add("selected-row");

        // Mettre à jour le lien
        if (nomStore === "partenaire") {
          const lienPanier = document.getElementById("btn-panier");
          if (lienPanier) {
            lienPanier.dataset.code = obj.id || "";
          }
          boutonAdd(obj, "transaction");
          afficherPaniersClient(obj.id);
        }

      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);

    if (nomStore === "transaction") {
      const tfoot = document.createElement("tfoot");
      const trTotal = document.createElement("tr");
      const panierId = donnees[0]?.panier || "inconnu";
      trTotal.innerHTML = `
      <td colspan="${colonnes.length + 2}"><strong>Total</strong></td>
      <td><strong>${total.toLocaleString()}</strong></td>
      <td><button class="btn-pay" data-page="paiements" data-code="${panierId}">💵 Payer</button></td>
    `;

      tfoot.appendChild(trTotal);
      table.appendChild(tfoot);

      // Événement sur le bouton Pay
      // const { totalTransaction, totalPaiement, balance } = await calculerBalance(panierId);

      if (balance < 1) {
        const btnPayer = trTotal.querySelector(".btn-pay");
        btnPayer.disabled = true;
        btnPayer.title = "Déjà payé";
        btnPayer.style.opacity = 0.5;
        btnPayer.style.cursor = "not-allowed";
        // return
      }


      trTotal.querySelector(".btn-pay").addEventListener("click", async (e) => {
        e.preventDefault();
        const codePanier = e.target.dataset.code;

        const champMontant = config.paiements.find(f => f.name === "montant");
        if (champMontant) {
          champMontant.max = balance; // ← total doit être défini ici
        }

        const formFactory = new FormulaireFactory(config);

        // Nettoyer le formulaire existant
        const zoneFormulaire = document.getElementById("fieldset");
        Array.from(zoneFormulaire.children).forEach(child => {
          if (child.tagName !== "LEGEND") child.remove();
        });

        // Afficher le formulaire de paiement
        const form = await formFactory.creerFormulaire("paiements", async (data) => {
          data.panier = codePanier;
          // data.montant = montant;
          await DBManager.add("paiements", data);
          afficherMessage("✅ Paiement enregistré.");
          afficherTransactionsDuPanier(codePanier); // pour rafraîchir
        });

        document.getElementById("frm_entite").innerHTML = "Formulaire : Paiement";
        zoneFormulaire.classList.remove("notshow");
        zoneFormulaire.appendChild(form);
        // ===================== Payer =================================
      });


    }

    return table;
  }

}

export async function afficherPaniersClient(idClient) {
  const paniers = await DBManager.getAll("panier");
  const paniersClient = paniers.filter(p => p.code === idClient);

  const container = document.getElementById("menu");
  container.innerHTML = ""; // vider l'ancien contenu

  // paniersClient.forEach(panier => {
  paniersClient
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)) // du plus récent au plus ancien
    .forEach(async (panier, i) => {

      const label = document.createElement("label");
      label.classList.add("label-panier");
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "panier-client";
      radio.value = panier.id;
      radio.dataset.code = panier.code;

      const { totalTransaction, totalPaiement, balance } = await calculerBalance(panier.id);

      label.title = `Total: ${totalTransaction} | Cash: ${totalPaiement} | Balance: ${balance} | Dernière modif:${panier.date}`;

      radio.addEventListener("change", async (e) => {
        const selectedPartenaire = e.target.dataset.code;
        const selectedPanier = e.target.value;

        //====================================================================================
        const zoneFormulaire = document.getElementById("fieldset");
        Array.from(zoneFormulaire.children).forEach(child => {
          if (child.tagName !== "LEGEND") {
            child.remove();
          }
        });
        zoneFormulaire.classList.remove("notshow");
        document.getElementById("frm_entite").innerHTML = `Formulaire : Transaction`;
        const formFactory = new FormulaireFactory(config);
        // const partenaire = await DBManager.get("partenaire", selectedPartenaire);
        // const type = partenaire?.categorie;
        // const indice = type === "client" ? 1 : -1;
        const indice = 1;

        const form = await formFactory.creerFormulaire("transaction", async (data) => {
          data.quantite = data.quantite * indice;
          data.panier = selectedPanier;
          await DBManager.add("transaction", data);
          afficherMessage("✅ Transaction enregistrée.");
          // ✅ Rafraîchir le tableau après ajout
          afficherTransactionsDuPanier(data.panier);
          // afficherTableau("transaction", selectedPanier);

        });

        zoneFormulaire.appendChild(form);

        //     // =============================afficher panier =============================
        afficherTransactionsDuPanier(selectedPanier);

      });


      const texte = document.createTextNode(` Transaction(${i + 1})`);

      const btnDelete = document.createElement("a");
      btnDelete.textContent = "🗑";
      btnDelete.title = "Supprimer ce panier";
      btnDelete.style.marginLeft = 0;
      btnDelete.style.padding = "0.5rem";
      btnDelete.style.color = "red";
      btnDelete.style.fontStyle = "normal";
      btnDelete.addEventListener("click", async (e) => {
        e.stopPropagation();
        const unused = await DBManager.peutSupprimerPanier(radio.value);
        if (unused) {
          if (confirm("Supprimer ce panier ?")) {
            await DBManager.delete("panier", radio.value);
            afficherPaniersClient(radio.dataset.code);
          }
        } else {
          afficherMessage("Inviolable");
        }
      });

      label.appendChild(radio);
      label.appendChild(texte);
      label.appendChild(btnDelete);
      container.appendChild(label);
      container.appendChild(document.createElement("br"));
    });


}

