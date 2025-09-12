import { DBManager } from "./db";

export class FormulaireFactory {
  constructor(config) {
    this.config = config;
  }
  async creerFormulaire(nomFormulaire, onSubmitCallback) {
    const form = document.createElement("form");
    form.className = "formulaire";

    const champs = this.config[nomFormulaire];
    for (const champ of champs) {
      const field = document.createElement("div");
      field.className = "form-field";
      form.classList.add("triple");

      let input;

      if (champ.type === "select") {
        input = document.createElement("select");
        input.name = champ.name;
        input.id = champ.id;

        if (champ.optionsFrom) {
          const optionsData = await DBManager.getAll(champ.optionsFrom);
          optionsData.forEach(obj => {
            const option = document.createElement("option");
            option.value = obj.id;
            option.textContent = obj.designation || obj.nom || obj.id;
            input.appendChild(option);
          });
        } else if (champ.options) {
          champ.options.forEach(opt => {
            const option = document.createElement("option");
            option.value = opt;
            option.textContent = opt;
            input.appendChild(option);
          });
        }
      } else {
        input = document.createElement("input");
        input.type = champ.hidden ? "hidden" : (champ.type || "text");
        input.name = champ.name;
        input.id = champ.id;
        if (champ.placeholder) input.placeholder = champ.placeholder;
        if (champ.required) input.required = true;
        if (champ.min != null) input.min = champ.min;
        if (champ.max != null) input.max = champ.max;
      }

      if (nomFormulaire === "transaction") {
        if (champ.name === "quantite") {
          input.max = 0; // valeur par défaut (à remplacer dynamiquement)
          input.placeholder = "Sélectionnez un produit";
        }
      }
      // Si ce n'est pas un champ hidden, on ajoute le label
      if (input.type !== "hidden") {
        const label = document.createElement("label");
        label.setAttribute("for", champ.id);
        label.textContent = champ.placeholder || champ.name;
        field.appendChild(label);
      }

      field.appendChild(input);

      // Pour les hidden, on évite d’ajouter la div inutilement
      if (input.type === "hidden") {
        form.appendChild(input);
      } else {
        form.appendChild(field);
      }
    }

    //-----------------Traitement special pour certain input---------------
    if (nomFormulaire === "transaction") {
      const inputProduit = form.querySelector("#produit");
      const inputQuantite = form.querySelector("#quantite");

      inputProduit.addEventListener("change", async () => {

        const codeProduit = inputProduit.value;
        const transactions = await DBManager.getAll("transaction");
        const stocks = await DBManager.getAll("stock");

        const totalEntree = stocks
          .filter(s => s.produit === codeProduit)
          .reduce((sum, s) => sum + parseFloat(s.quantite), 0);

        const totalSortie = transactions
          .filter(t => t.produit === codeProduit)
          .reduce((sum, t) => sum + parseFloat(t.quantite), 0);

        const disponible = totalEntree - totalSortie;

        inputQuantite.max = disponible;
        inputQuantite.placeholder = `Max: ${disponible}`;
      });
    }
    const btn = document.createElement("button");
    btn.type = "submit";
    btn.textContent = "✅ Valider";
    form.appendChild(btn);

    form.onsubmit = async (e) => {
      e.preventDefault();
      const data = {};
      new FormData(form).forEach((val, key) => data[key] = val);
      onSubmitCallback(data);
    };

    return form;
  }
}
