const config = configuration();


document.addEventListener("DOMContentLoaded", async () => {
  const zoneFormulaire = document.getElementById("fieldset");
  const login = document.getElementById("login");
  // Ton code d'initialisation
  await DBManager.init();

  const bourse = await DBManager.getAllPlafond()
  const used = await DBManager.getTotalPaiements()
  window.Disponible = (bourse - used);
  // alert(Disponible);
  //=======================Login========================
  login.addEventListener("click", async () => {
    const dernier = await DBManager.getDerniereLicence();
    if (!dernier) return;
    sommaire.innerHTML = register;
    const auth = document.getElementById("loginUser");
    const resetPassword = document.getElementById("resetPassword");
    const forpass = document.getElementById("forpass");
    const forpassrepeat = document.getElementById("forpassrepeat");
    const bouton = document.querySelector("#loginUser button[type='submit']");

    // Désactiver au début
    bouton.disabled = true;
    let essai = 0;
    const decoded = JSON.parse(atob(dernier.id));
    auth.ninu.addEventListener("input", async (e) => {
      const i = (auth.ninu.value).length;

      bouton.disabled = (i < 10);//on l'active si input valide
      forpass.classList.add("notshow")
      if (i == 10) {
        const cpright = await crypterMotDePasse(decoded.plafond);

        //=========================Je verifie la licence===================
        bouton.disabled = (decoded.copyright != cpright); //on desactive le bouton si la licence est incorrecte
        if ((decoded.copyright != cpright)) {
          alert("Votre licence est invalide, veuillez contacter l'equipe Edutech \n ou recharger la licence dans paramettre ⚙")
        }
        //==================================================================

        if (decoded.ninu == Number(auth.ninu.value)) {
          if ("password" in dernier) {
            forpass.classList.remove("notshow");
            bouton.innerHTML = "Login"
            //La si mot passe egal ok->admin
          } else {
            forpass.classList.remove("notshow");
            forpassrepeat.classList.remove("notshow");
            auth.psw_repeat.addEventListener("input", () => { bouton.disabled = (auth.psw.value != auth.psw_repeat.value); })
          }
        }
      }
    })
    auth.addEventListener("submit", async (e) => {
      e.preventDefault();
      // console.table(dernier);
      if (auth.psw_repeat.value) {
        const cryptPass = await crypterMotDePasse(auth.psw.value);
        dernier.password = cryptPass;
        DBManager.update("licence", dernier);
        location.reload();
      } else if (auth.psw.value) {
        const monPass = await crypterMotDePasse(auth.psw.value);
        if (dernier.password == monPass) {
          afficherMessage("Vous êtes connecté");
          location.reload();
        } else {
          if (essai < 5) {
            afficherMessage("Attention il y a une erreur dans votre mot de passe.");
          } else {
            const reponse = confirm("Veux-tu reinitialiser le mot de passe ?")
            if (reponse) {
              sommaire.innerHTML = resetPasword;
              const boutonreset = document.querySelector("#resetPassword button[type='submit']");
              const formreset = document.querySelector("#resetPassword");
              boutonreset.addEventListener("click", async (e) => {
                e.preventDefault();
                const objet = {
                  nom: formreset.nom.value,
                  prenom: formreset.prenom.value,
                  ninu: formreset.ninu.value,
                  plafond: formreset.plafond.value,
                  psw: (formreset.psw.value == formreset.psw_repeat.value) ? formreset.psw.value : false,
                }
                if (objet.nom == decoded.nom && objet.prenom == decoded.prenom && objet.ninu == decoded.ninu && objet.plafond == decoded.plafond) {
                  if (objet.psw) {
                    const cryptPass = await crypterMotDePasse(objet.psw);
                    dernier.password = cryptPass;
                    DBManager.update("licence", dernier);
                    alert("Votre mot de passe a été réinitialisé");
                    location.reload();
                  } else {
                    alert("Confoirmez votre mot de passe")
                  }
                } else {
                  alert("Votre mot de passe n'a pas été réinitialisé \n Verifiez les informations fournies.")
                }
              });
            }
          }

        }

      }

      essai++;
    })
  })
  //=======================Login========================

  const donnees = await genererInfosClients();

  const sommaire = document.getElementById("sommaire");
  const tab = document.getElementById("container");
  const tablinks = document.getElementsByClassName("tablinks");
  var i;

  const btn_rapport = document.getElementById("btn-rapport");

  btn_rapport.addEventListener("click", async (e) => {
    const rapport = await genererRapport();
    if (tab && tab.children.length > 0) {
      tab.children[0].remove(); // Supprime le 2ᵉ enfant
    }
    afficherRapport(rapport, tab);
    sommaire.classList.remove("notshow");
  })

  document.getElementById("rTrans").addEventListener("click", async (e) => {
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].classList.remove("active");
    }
    e.target.classList.add("active");
    const rapport = await genererRapport();
    afficherRapport(rapport, tab);
    // afficherEtatStock(etat,tab)
  });

  document.getElementById("rTrans").click(); //Afficher le rapport transaction par defaut
  document.getElementById("rClient").addEventListener("click", async (e) => {
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].classList.remove("active");
    }
    e.target.classList.add("active");
    // const etat = await calculerEtatStock("today");
    // tab.innerHTML="";
    const donnees = await genererInfosClients();
    afficherTableauClients(donnees, tab);

    // afficherEtatStock(etat,tab)
  });

  document.getElementById("today").addEventListener("click", async (e) => {
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].classList.remove("active");
    }
    e.target.classList.add("active");
    const etat = await calculerEtatStock("today");
    tab.innerHTML = "";
    afficherEtatStock(etat, tab)
  });

  document.getElementById("moisCourant").addEventListener("click", async (e) => {
    const etat = await calculerEtatStock("moisCourant");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].classList.remove("active");
    }
    e.target.classList.add("active");
    tab.innerHTML = "";
    afficherEtatStock(etat, tab)
  });

  document.getElementById("moisDernier").addEventListener("click", async (e) => {
    const etat = await calculerEtatStock("moisDernier");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].classList.remove("active");
    }
    e.target.classList.add("active");
    tab.innerHTML = "";
    afficherEtatStock(etat, tab)
  })
  //Écouteur sur le bouton accueil
  document.getElementById("copyright").addEventListener("click", (e) => {

    e.preventDefault();
    const valid_key = "&#129419;La chenille volera"

    let key = prompt("Insert your secret key", "🦋La chenille volera");
    if (key != null) {
      if (key == valid_key) {
    document.getElementById("sommaire").innerHTML = creerLicence;

    const form = document.getElementById("formulaire");

    form.addEventListener("submit", async (e) => {
      e.preventDefault(); // Empêche le rechargement de la page

      const commandeLicence = document.getElementById("commandeLicence").value;

      if (!commandeLicence) {
        alert("Veuillez coller la requête.");
        return;
      }
      const resultat = textareaVersObjet(commandeLicence);
      const cpright = await crypterMotDePasse(resultat.plafond);

      const licence = {
        nom: resultat.nom,
        prenom: resultat.prenom,
        ninu: resultat.ninu,
        plafond: resultat.plafond,
        copyright: cpright
      };

      const encoded = btoa(JSON.stringify(licence));
      const crypt = { id: encoded };

      //------------------------------Telecharger le fichier--------------------------
      const blob = new Blob([JSON.stringify(crypt, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `licence_${resultat.ninu} .json`;
      a.click();
      URL.revokeObjectURL(url);
      //------------------------------------------------------------------------------

    });
      }
    }

  });

  //Écouteur sur le bouton nouveau
  const partenaire = document.getElementById("btn-nouveau");
  partenaire.addEventListener("click", (e) => {
    e.preventDefault();
    zoneFormulaire.classList.add("notshow");
    sommaire.classList.add("notshow");

    document.getElementById("cart").innerHTML = "";
    const aside = document.getElementById("new_btn");
    if (aside && aside.children.length > 0) {
      aside.children[0].remove(); // Supprime le 2ᵉ enfant
    }
    boutonAdd({}, "partenaire");
    afficherTableau("partenaire");
    // if (this.onRefresh) this.onRefresh();
  })

  // Écouteur sur le bouton produit
  const produit = document.getElementById("btn-produit");
  produit.addEventListener("click", (e) => {
    e.preventDefault();
    zoneFormulaire.classList.add("notshow");
    sommaire.classList.add("notshow");
    document.getElementById("cart").innerHTML = "";

    const aside = document.getElementById("newpan");
    if (aside && aside.children.length > 1) {
      aside.children[1].remove(); // Supprime le 2ᵉ enfant
    }

    boutonAdd({}, "produit");
    afficherTableau("produit");
  })

  // Écouteur sur le bouton stock
  const stock = document.getElementById("btn-stock");
  stock.addEventListener("click", (e) => {
    e.preventDefault();
    zoneFormulaire.classList.add("notshow");
    sommaire.classList.add("notshow");
    document.getElementById("cart").innerHTML = "";

    const aside = document.getElementById("newpan");
    if (aside && aside.children.length > 1) {
      aside.children[1].remove(); // Supprime le 2ᵉ enfant
    }

    boutonAdd({}, "stock");
    afficherTableau("stock");
  })


  // Ecouteur sur bouton recherche
  document.getElementById("recherche").addEventListener("input", async (e) => {
    const motCle = e.target.value.toLowerCase();
    sommaire.classList.add("notshow");
    // Récupère tous les partenaires depuis IndexedDB
    const partenaires = await DBManager.getAll("partenaire");

    // Filtrer ceux dont le nom contient le mot-clé
    const resultats = partenaires.filter(p =>
      p.nom && p.nom.toLowerCase().includes(motCle)
    );

    // Réaffiche le tableau avec les résultats filtrés
    const factory = new TableauFactory(config);

    const tableau = await factory.creerTableau("partenaire", resultats);
    //   const zone = document.getElementById("table-zone");
    const zone = document.getElementById("tableau");
    zone.innerHTML = "";
    zone.appendChild(tableau);
  });

  //Ecouteur sur paramettre
  document.getElementById("setting").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("importFile").click();
  });
  document.getElementById("importFile").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) DBManager.importerLicence(file);
  });

  // const factory = new FormulaireFactory(config);
  async function afficherTableau(nomStore) {
    const donnees = await DBManager.getAll(nomStore);

    const factory = new TableauFactory(config, {
      onEdit: async (obj) => {
        // console.log("Éditer", obj);
        // Code pour remplir le formulaire et éditer
        const formFactory = new FormulaireFactory(config);
        const form = await formFactory.creerFormulaire(nomStore, async (data) => {
          data.id = obj.id;
          // console.log(nomStore);
          await DBManager.add(nomStore, data);
          afficherMessage(`✅ ${nomStore} modifié.`);
          afficherTableau(nomStore); // Recharge le tableau si nécessaire
        });

        // Remplir les valeurs du formulaire avec `obj`
        for (const [key, value] of Object.entries(obj)) {
          const champ = form.querySelector(`[name="${key}"]`);
          if (champ) champ.value = value;
        }

        const zone = document.getElementById("fieldset");
        zone.classList.remove("notshow")
        zone.innerHTML = "";
        zone.appendChild(form);

      },
      onDelete: async (donnees) => {
        await DBManager.delete(nomStore, donnees.id);
        afficherMessage("✅ Supprimé !");
        afficherTableau(nomStore); // Rafraîchir l'affichage
      }
    });

    const tableau = await factory.creerTableau(nomStore, donnees);
    // const zoneTableau = document.getElementById("table-zone");
    const zoneTableau = document.getElementById("tableau");
    zoneTableau.innerHTML = "";
    zoneTableau.appendChild(tableau);

  }

  // afficherTableau("partenaire");
  window.afficherTransactionsDuPanier = async function (selectedPanier) {
    const transactions = await DBManager.getAll("transaction");
    const duPanier = transactions.filter(t => t.panier === selectedPanier);

    const factory = new TableauFactory(config);
    const tableau = await factory.creerTableau("transaction", duPanier);

    // const zone = document.getElementById("table-zone");
    const zone = document.getElementById("tableau");
    zone.innerHTML = "";
    zone.appendChild(tableau);
  };

  // le bouton ajouter nouveau
  function boutonAdd(obj, contexte) {
    const btnNouveau = document.createElement("button");
    btnNouveau.innerHTML = "+";
    btnNouveau.title = contexte;
    btnNouveau.classList.add("btn-flottant");
    btnNouveau.dataset.code = obj.id || "";
    if (contexte === "transaction") {
      const aside = document.getElementById("new_btn");
      if (aside && aside.children.length > 0) {
        aside.children[0].remove(); // Supprime le 2ᵉ enfant
      }
      aside.appendChild(btnNouveau);
    } else {
      document.body.appendChild(btnNouveau);
    }

    btnNouveau.addEventListener("click", async () => {
      const zoneFormulaire = document.getElementById("fieldset");
      Array.from(zoneFormulaire.children).forEach(child => {
        if (child.tagName !== "LEGEND") {
          child.remove();
        }
      });
      if (contexte != "transaction") {
        zoneFormulaire.classList.remove("notshow");
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


  function textareaVersObjet(texte) {
    const lignes = texte.split('\n').map(l => l.trim()).filter(l => l !== '');
    const obj = {};

    for (let i = 0; i < lignes.length; i += 2) {
      const cle = lignes[i];
      const valeur = lignes[i + 1] || '';
      obj[cle] = isNaN(valeur) ? valeur : Number(valeur);
    }

    return obj;
  }


});

function configuration() {
  return {
    partenaire: [
      { name: "nom", id: "nom", type: "text", placeholder: "Nom du partenaire", required: true },
      { name: "prenom", id: "prenom", type: "text", placeholder: "Prenom du partenaire", required: true },
      { name: "telephone", id: "telephone", type: "text", placeholder: "Telephone du partenaire", required: true },
      { name: "ninu", id: "ninu", type: "text", placeholder: "NINU du partenaire" },
      { name: "categorie", id: "categorie", type: "select", options: ["fournisseur", "client"], required: true },
      { name: "adresse", id: "adresse", type: "text", placeholder: "Adresse du partenaire" }
    ],

    panier: [
      { name: "code", id: "code", "type": "hidden" },
      { name: "montant", id: "montant", "type": "hidden" },
      { name: "balance", id: "balance", "type": "hidden" }
    ],
    produit: [
      { name: "designation", id: "designation", type: "text", placeholder: "Designation du produit", required: true },
      { name: "categorie", id: "categorie", type: "select", options: ["Materiau", "Nourriture"], required: true },
      { name: "pu", id: "pu", type: "number", placeholder: "Prix unitaire", min: 1, required: true }
    ],

    transaction: [
      { name: "produit", id: "produit", type: "select", optionsFrom: "produit", required: true }, // options à remplir dynamiquement
      { name: "quantite", id: "quantite", type: "number", placeholder: "Quantité vendue", min: 1, required: true },
      { name: "panier", id: "panier", "type": "hidden" }
    ],

    stock: [
      { name: "produit", id: "produit", type: "select", optionsFrom: "produit", required: true }, // options à remplir dynamiquement
      { name: "quantite", id: "quantite", type: "number", placeholder: "Quantité achetée", min: 1, required: true },
      { name: "prix", id: "prix", type: "number", placeholder: "Prix d'achat", min: 1, required: true }
    ],

    paiements: [
      { name: "montant", id: "montant", type: "number", min: "10", placeholder: "montant", required: true },
      { name: "panier", id: "panier", "type": "hidden" },
      { name: "par", id: "par", type: "text", placeholder: "par client" }
    ],

    livraison: [
      { name: "produit", id: "produit", type: "select", optionsFrom: "produit", required: true },
      { name: "quantite", id: "quantite", type: "number", placeholder: "Quantité livrée", min: 1, maxFromStock: true, required: true },
      { name: "panier", id: "panier", type: "hidden" },
      { name: "date", id: "date", type: "hidden", required: true }
    ]
  }
}

class DB {
  constructor(nomDB, stores = []) {
    this.nomDB = nomDB;
    this.stores = stores;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.nomDB, 1); // incrémente si déjà 2

      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("licence")) {
          db.createObjectStore("licence", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("users")) {
          db.createObjectStore("users", { keyPath: "id" });
        }

        this.stores.forEach(s => {
          if (!db.objectStoreNames.contains(s)) {
            const store = db.createObjectStore(s, { keyPath: "id" });
            // Ajouter un index uniquement pour le store "classes"
            if (s === "transaction") {
              store.createIndex("parCode", "panier", { unique: false });
            }
            // Ajouter un index uniquement pour le store "paiement"
            if (s === "paiements") {
              store.createIndex("cartPaiement", "panier", { unique: false });
            }

          }
        });
      };

      req.onsuccess = e => {
        this.db = e.target.result;
        resolve();
      };

      req.onerror = () => reject("Erreur d'ouverture");
    });
  }

  async add(store, obj) {
    const id = this.IdUnique(store, obj);
    const existant = await this.get(store, id);

    // Si c'est une transaction existante, on cumule la quantité
    if ((store === "transaction" || store === "stock") && existant) {
      obj.quantite = Number(obj.quantite) + Number(existant.quantite);
      obj.date = existant.date; // conserver la date d'origine
    }

    // Attribuer un ID unique et une date de mise à jour
    obj.id = id;
    obj.updated_at = new Date().toISOString();

    // Conserver la date de création seulement si nouvel objet
    if (!existant) {
      obj.date = new Date().toLocaleString("sv-SE").replace(" ", "T");
    }

    return new Promise((res, rej) => {
      const tx = this.db.transaction(store, "readwrite");
      tx.objectStore(store).put(obj); // Remplace si existe
      tx.oncomplete = () => {
        if (existant) {
          afficherMessage(`${store} mis à jour.`);
        } else {
          afficherMessage(`${store} ajouté.`);
        }
        res();
      };
      tx.onerror = () => rej("Ajout ou mise à jour échoué");
    });
  }

  async licence(obj) {
    obj.date = new Date().toLocaleString("sv-SE").replace(" ", "T");
    obj.updated_at = new Date().toISOString();

    return new Promise((res, rej) => {
      const tx = this.db.transaction("licence", "readwrite");
      tx.objectStore("licence").put(obj); // Remplace si existe
      tx.oncomplete = () => {
        afficherMessage(`licence ajouté.`);
        res();
      };
      tx.onerror = () => rej("Ajout ou mise à jour échoué");
    });
  }

  async importerLicence(fichier) {
    const texte = await fichier.text();
    const donnees = JSON.parse(texte);

    // for (const item of donnees) {
    try {
      await this.licence(donnees);
    } catch (e) {
      console.error(`Erreur en important dans licence`, e);
    }
    // }
    afficherMessage("Importation terminée !");
  }

  async update(store, obj) {
    if (!obj.id) {
      afficherMessage("Objet sans ID.");
      return;
    }

    const existant = await this.get(store, obj.id);
    if (!existant) {
      afficherMessage(`${store} inexistant.`);
      return;
    }
    // On conserve la date de création si elle existe
    obj.date = existant.date || new Date().toLocaleString("sv-SE").replace(" ", "T");
    // Mise à jour de la date de modification
    obj.updated_at = new Date().toISOString();

    return new Promise((res, rej) => {
      const tx = this.db.transaction(store, "readwrite");
      tx.objectStore(store).put(obj);
      tx.oncomplete = () => {
        afficherMessage(`${store} modifié.`);
        res();
      };
      tx.onerror = () => rej("Modification échouée");
    });

  }

  delete(table, id) {
    return new Promise((resolve) => {
      const tx = this.db.transaction(table, "readwrite");
      const store = tx.objectStore(table);
      store.delete(id).onsuccess = () => resolve();
    });
  }

  get(table, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(table, "readonly");
      const store = tx.objectStore(table);
      const req = store.get(id);
      req.onsuccess = e => resolve(e.target.result);
      req.onerror = e => reject(e);
    });
  }

  async getAll(table) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(table, "readonly");
      const store = tx.objectStore(table);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = e => reject(e);
    });
  }

  async getAllByIndex(store, indexName, value) {
    return new Promise((res, rej) => {
      const tx = this.db.transaction(store, "readonly");
      const index = tx.objectStore(store).index(indexName);
      const request = index.getAll(value);

      request.onsuccess = () => res(request.result);
      request.onerror = () => rej("Erreur lors de la lecture par index");
    });
  }

  IdUnique(store, data) {

    let today = new Date().toLocaleString("sv-SE").replace(" ", "T");
    let d = today.split("T")[0];
    let h = today.split("T")[1];
    d = d.split("-");
    h = h.split(":");
    let jour = `${d[1]}${d[2]}${h[0]}${h[1]}`

    if (store === "produit") {
      const base = `${data.designation}${data.categorie}`;
      return this._hash(base);
    }
    else if (store === "transaction") {
      return `${data.produit}_${data.panier}`;
    }
    else if (store === "stock") {
      const base = `${data.produit}_${jour}`;
      return this._hash(base);
    }
    else if (store === "partenaire") {
      return `${data.telephone}`;
    }
    else if (store === "panier") {
      return `${data.code}_${jour}`;
    }
    else if (store === "paiements") {
      return `${data.panier}_${jour}`;
    }
    else if (store === "livraison") {
      return `${data.panier}_${jour}`;
    }
    else {
      afficherMessage(`${store} inexistant`)
    }

  }
  _hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h).toString().padStart(10, "1");
  }

  async getVersementTot(matricule) {
    const paiements = await this.getAll("paiements");

    const total = paiements
      .filter(p => p.matricule === matricule)
      .reduce((somme, p) => somme + Number(p.montant), 0);

    return total;

  }

  //a ameliorer pour l'annee avec index
  async getFraisScolaire(classe) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("classes", "readonly");
      const store = tx.objectStore("classes");
      const index = store.index("parClasse");
      const req = index.get(classe);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getDernierPaiement(matricule) {
    const paiements = await this.getAll("paiements");
    const paiementsEleve = paiements
      .filter(p => p.matricule === matricule)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    return paiementsEleve[0] || null;
  }

  async compterEffectif(annee) {
    const tous = await gestionnaire.getAll("registre");
    return tous.filter(r => r.annee_scolaire === annee).length;
  }

  // Vérifie la validité de la licence avant ajout dans 'registre'
  async controlEffectif(annee) {
    const licence = await this.get("licence", annee);
    if (!licence) throw new Error("Aucune licence active pour cette année.");

    const effectif = this.compterEffectif(annee)

    if (effectif >= licence.effectif) {
      throw new Error("Effectif maximum atteint pour cette licence.");
    }

  }

  // Verifier si apprenant peut etre supprime
  async peutSupprimerPartenaire(id) {
    const panier = await this.getAll("panier");
    return !panier.some(r => r.code === id);
  }
  // Verifier si panier peut etre supprime
  async peutSupprimerPanier(id) {
    const panier = await this.getAll("transaction");
    return !panier.some(r => r.panier === id);
  }
  // Verifier si produit peut etre supprime 
  async peutSupprimerProduit(id) {
    const produit = await this.getAll("transaction");
    return !produit.some(r => r.produit === id);
  }

  async peutSupprimerRegistre(registreId) {
    const [annee_scolaire, matricule] = registreId.split("_");

    const paiements = await this.getAll("paiements");
    const bulletins = await this.getAll("bulletin");

    const aDesPaiements = paiements.some(p => p.annee_scolaire === annee_scolaire && p.matricule === matricule);
    const aDesBulletins = bulletins.some(b => b.annee_scolaire === annee_scolaire && b.matricule === matricule);

    return !(aDesPaiements || aDesBulletins);
  }

  async exporterBD(nomBD) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(nomBD);
      request.onsuccess = async (event) => {
        const db = event.target.result;
        const exportData = {};
        const storeNames = db.objectStoreNames;

        const tx = db.transaction(storeNames, "readonly");

        let remaining = storeNames.length;
        for (let storeName of storeNames) {
          const store = tx.objectStore(storeName);
          const getAllReq = store.getAll();
          getAllReq.onsuccess = () => {
            exportData[storeName] = getAllReq.result;
            if (--remaining === 0) {
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = nomBD + ".json";
              a.click();
              URL.revokeObjectURL(url);
              resolve();
            }
          };
          getAllReq.onerror = reject;
        }
      };
      request.onerror = reject;
    });
  }

  async importerBD(fichier) {
    const texte = await fichier.text();
    const donnees = JSON.parse(texte);

    for (const storeName in donnees) {
      const records = donnees[storeName];
      for (const item of records) {
        try {
          await this.ajouter(storeName, item);
        } catch (e) {
          console.error(`Erreur en important dans ${storeName}`, e);
        }
      }
    }

    afficherMessage("Importation terminée !");
  }
  // ----------------------------------semi auto-----------------------
  async sauvegarder() {
    db.onsuccess = async function () {
      const database = this.result;
      const stores = Array.from(database.objectStoreNames);
      const backup = {};

      const tx = database.transaction(stores, "readonly");

      await Promise.all(stores.map(store => {
        return new Promise((resolve, reject) => {
          const req = tx.objectStore(store).getAll();
          req.onsuccess = () => {
            backup[store] = req.result;
            resolve();
          };
          req.onerror = reject;
        });
      }));

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `edumod-backup-${date}.json`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
  }

  restaurer(fichier) {
    const lecteur = new FileReader();
    lecteur.onload = async function (e) {
      const contenu = JSON.parse(e.target.result);
      const stores = Object.keys(contenu);

      const tx = this.transaction(stores, "readwrite");

      for (let store of stores) {
        const objectStore = tx.objectStore(store);
        for (let objet of contenu[store]) {
          objectStore.put(objet); // remplace ou ajoute
        }
      }

      tx.oncomplete = () => afficherMessage("Restauration terminée.");
      tx.onerror = () => afficherMessage("Erreur lors de la restauration.");
    };

    lecteur.readAsText(fichier);
  }
  // ===========================backup=======================
  async backup() {
    const backup = {};

    for (let store of this.stores) {
      backup[store] = await this.getAll(store);
    }

    const blob = new Blob([JSON.stringify(backup)], { type: "application/json" });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const ref = firebase.storage().ref(`backups/edutech-${timestamp}.json`);
    await ref.put(blob);
    afficherMessage("✅ Backup envoyé dans Firebase Storage");

  }

  //==================Derniere licence==========================
  async getDerniereLicence() {
    const licences = await this.getAll("licence");
    if (!licences.length) return null;
    // Tri par date décroissante
    licences.sort((a, b) => new Date(b.date) - new Date(a.date));
    return licences[0];
  }




  // =====================Chiffre d'affaire=============================
  async getAllPlafond() {
    const licences = await DBManager.getAll("licence");
    let total = 0;

    for (const licence of licences) {
      try {
        // Décoder l'id base64 en JSON
        const jsonStr = atob(licence.id);
        const obj = JSON.parse(jsonStr);

        // Ajouter le plafond s’il existe
        const plafond = parseFloat(obj.plafond);
        if (!isNaN(plafond)) {
          total += plafond;
        }
      } catch (e) {
        console.warn("Erreur de décodage pour l'id :", licence.id, e);
      }
    }

    return total;
  }

  async getTotalPaiements() {
    const paiements = await this.getAll("paiements");
    return paiements.reduce((somme, p) => somme + (parseFloat(p.montant) || 0), 0);
  }

  async verifieNINU(ninuRecherche) {
    const licences = await DBManager.getAll("licence");

    for (const licence of licences) {
      try {
        const jsonStr = atob(licence.id);
        const obj = JSON.parse(jsonStr);

        if (obj.ninu == ninuRecherche) {
          return licence; // trouvé
        }
      } catch (e) {
        console.warn("Erreur de décodage:", licence.id, e);
      }
    }
  }


}
const DBManager = new DB("Newstore", Object.keys(config));

class TableauFactory {
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
    } else {
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
          openNav();
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

      // Si votre solde passe a zeo les paiements seront desctives
      trTotal.querySelector(".btn-pay").disabled = (!(Disponible - total) > 0);
      trTotal.querySelector(".btn-pay").title = `Le solde de votre compte est : ${(Disponible - total).toLocaleString()} GHT`;

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

class Rapport {
  constructor() {
    this.data = {
      today: this.initLigne(),
      moisCourant: this.initLigne(),
      moisDernier: this.initLigne()
    };
  }

  initLigne() {
    return {
      achat: 0,
      recette: 0,
      encaissement: 0,
      balance: 0
    };
  }


  ajouterStock(stock) {
    const montant = Number(stock.quantite) * Number(stock.prix);
    const keys = this.getPeriodeKeys(stock.date);
    keys.forEach(k => this.data[k].achat += montant);
  }

  getPeriodeKeys(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();

    const keys = [];
    const todayStr = now.toISOString().slice(0, 10);
    const dStr = d.toISOString().slice(0, 10);

    if (dStr === todayStr) keys.push("today");

    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
      keys.push("moisCourant");
    }

    const moisDernier = (now.getMonth() - 1 + 12) % 12;
    const anneeDernier = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    if (d.getMonth() === moisDernier && d.getFullYear() === anneeDernier) {
      keys.push("moisDernier");
    }

    return keys;
  }


  ajouterPaiement(paiement) {
    const montant = Number(paiement.montant);
    const keys = this.getPeriodeKeys(paiement.date);
    keys.forEach(k => this.data[k].encaissement += montant);
  }

  getRapport() {
    return this.data;
  }

}

class FormulaireFactory {
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

function ouvrirApercuHTML(titre, contenuHTML, orientation = "portrait") {
  const fenetre = window.open("", "_blank");

  fenetre.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${titre}</title>
      <style>
        @page  size:${orientation}; margin: 0.3in 1in; }
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      </style>
    </head>
    <body>${contenuHTML}</body>
    </html>
  `);

  fenetre.document.close();

  return fenetre;
}

function years() {
  const date = new Date();
  const year = date.getFullYear();
  const n1 = ((year * 1) - 2) + "-" + ((year * 1) - 1);
  const n2 = ((year * 1) - 1) + "-" + ((year * 1));
  const n3 = (year * 1) + "-" + ((year * 1) + 1);
  const n4 = ((year * 1) + 1) + "-" + ((year * 1) + 2);
  return [n1, n2, n3, n4];
}

function afficherMessage(texte, duree = 3000) {
  const box = document.getElementById("message-box");
  if (!box) return;
  box.textContent = texte;
  box.style.display = "block";       // 👈 Assure qu'elle est visible
  box.style.opacity = 1;
  clearTimeout(box._timeout);
  box._timeout = setTimeout(() => {
    box.style.display = "none";    // 👈 Cache après fondu
    box.style.opacity = 0;
  }, duree);
}

async function chargerFirebase() {
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js");
    const { getFirestore, collection, doc, setDoc, getDocs } = await import("https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js");
    console.log("✅ Firebase CDN chargé");
    return { initializeApp, getFirestore, collection, doc, setDoc, getDocs };
  } catch (e) {
    console.warn("⚠ Échec CDN, chargement local...");
    const { initializeApp } = await import("./js/libs/firebase-app.js");
    const { getFirestore, collection, doc, setDoc, getDocs } = await import("./js/libs/firebase-firestore.js");
    console.log("✅ Firebase local chargé");
    return { initializeApp, getFirestore, collection, doc, setDoc, getDocs };
  }
}

const messageInfos = `
  <div style="border: 1px solid #2196F3; background: #E3F2FD; padding: 1rem; border-radius: 6px; font-family: Arial;">
    <h3 style="color: #0D47A1; margin-top: 0;">📌 Important : Enregistrement vs Inscription</h3>
    
    <p style="margin-top: 1em;"><strong>👤 Enregistrement d’un élève (illimité & gratuit)</strong><br>
    ➤ Ajoutez les informations personnelles des élèves (nom, prénom, date de naissance,  etc.).<br>
    ➤ Cette opération est gratuite et sans limite.</p>

    <p style="margin-top: 1em;"><strong>📝 Inscription scolaire (limitée selon le quota payé)</strong><br>
    ➤ Associez l’élève à une classe pour l’année scolaire en cours.<br>
    ➤ Le montant à prévoir par inscription est de <strong>$2 US</strong>. La limite dépend du forfait activé.</p>

    <p style="margin-top: 1em;"><strong>🎯 Sécuriser les données</strong><br>
    ✔ <span>&#9729; Sauvegarde Cloud</span> (firestore) automatique</p>
  </div>
`;

const evaluations = [
  { id: "controle_1", label: "1er Contrôle" },
  { id: "controle_2", label: "2e Contrôle" },
  { id: "controle_3", label: "3e Contrôle" },
  { id: "controle_4", label: "4e Contrôle" },
  { id: "janvier", label: "Janvier" },
  { id: "fevrier", label: "Février" },
  { id: "mars", label: "Mars" },
  { id: "avril", label: "Avril" },
  { id: "mai", label: "Mai" },
  { id: "juin", label: "Juin" },
  { id: "juillet", label: "Juillet" },
  { id: "aout", label: "Août" },
  { id: "septembre", label: "Septembre" },
  { id: "octobre", label: "Octobre" },
  { id: "novembre", label: "Novembre" },
  { id: "decembre", label: "Décembre" },
  { id: "trimestre_1", label: "1er Trimestre" },
  { id: "trimestre_2", label: "2e Trimestre" },
  { id: "trimestre_3", label: "3e Trimestre" }
];

async function calculerBalance(codePanier) {
  await DBManager.init();
  const transactions = await DBManager.getAll("transaction");
  const paiements = await DBManager.getAll("paiements");
  const produits = await DBManager.getAll("produit");

  const duPanier = transactions.filter(t => t.panier === codePanier);
  const paiementsDuPanier = paiements.filter(p => p.panier === codePanier);

  const totalTransaction = duPanier.reduce((sum, t) => {
    const produit = produits.find(p => p.id === t.produit);
    const pu = produit ? Number(produit.pu) : 0;
    const qte = Number(t.quantite);
    return sum + (qte * pu);
  }, 0);

  const totalPaiement = paiementsDuPanier.reduce((sum, p) => sum + Number(p.montant || 0), 0);
  const balance = totalTransaction - totalPaiement;

  return { totalTransaction, totalPaiement, balance };
}

async function getResteALivrer(panierId) {
  const transactions = await DBManager.getAll("transaction");
  const livraisons = await DBManager.getAll("livraison");

  const duPanier = transactions.filter(t => t.panier === panierId);
  const livrees = livraisons.filter(l => l.panier === panierId);

  const map = {};

  for (const t of duPanier) {
    map[t.produit] = (map[t.produit] || 0) + Math.abs(t.quantite);
  }

  for (const l of livrees) {
    map[l.produit] = (map[l.produit] || 0) - Math.abs(l.quantite);
  }

  return map; // produit => quantité à livrer encore
}

async function genererRapport() {
  await DBManager.init();
  const rapport = new Rapport();

  const stocks = await DBManager.getAll("stock");
  stocks.forEach(s => rapport.ajouterStock(s));

  const paiements = await DBManager.getAll("paiements");
  paiements.forEach(p => rapport.ajouterPaiement(p));

  return rapport.getRapport();
}


async function calculerRecetteParTransactions(periode) {
  await DBManager.init();
  const transactions = await DBManager.getAll("transaction");
  const produits = await DBManager.getAll("produit");

  const transactionsFiltrees = transactions.filter(t =>
    estDansPeriode(t.date, periode)
  );

  return transactionsFiltrees.reduce((total, t) => {
    const produit = produits.find(p => p.id === t.produit);
    const pu = produit ? Number(produit.pu) : 0;
    const qte = Number(t.quantite);
    return total + (qte * pu);
  }, 0);
}

function estDansPeriode(dateStr, periode) {
  const d = new Date(dateStr);
  const aujourdHui = new Date();

  if (periode === "today") {
    return d.toDateString() === aujourdHui.toDateString();
  }

  if (periode === "moisCourant") {
    return (
      d.getFullYear() === aujourdHui.getFullYear() &&
      d.getMonth() === aujourdHui.getMonth()
    );
  }

  if (periode === "moisDernier") {
    const moisDernier = new Date();
    moisDernier.setMonth(moisDernier.getMonth() - 1);
    return (
      d.getFullYear() === moisDernier.getFullYear() &&
      d.getMonth() === moisDernier.getMonth()
    );
  }

  return false;
}

async function calculerEtatStock(periode) {
  await DBManager.init();
  const stock = await DBManager.getAll("stock");
  const transactions = await DBManager.getAll("transaction");
  const produits = await DBManager.getAll("produit");

  const dateToStr = d => d.toISOString().slice(0, 10);
  const now = new Date();
  const todayStr = dateToStr(now);
  const moisStr = now.toISOString().slice(0, 7); // ex: "2025-09"

  const filtrerParPeriode = (obj, cle) => {
    if (!obj[cle]) return false;
    const date = new Date(obj[cle]);
    const dStr = dateToStr(date);
    const mStr = date.toISOString().slice(0, 7);

    if (periode === "today") return dStr === todayStr;
    if (periode === "moisCourant") return mStr === moisStr;
    if (periode === "moisDernier") {
      const moisDernier = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);
      return mStr === moisDernier;
    }
    return true; // si pas de période, inclure tout
  };

  const etatParProduit = [];

  for (const produit of produits) {
    const idProduit = produit.id;

    const receptions = stock
      .filter(s => s.produit === idProduit && filtrerParPeriode(s, "date"))
      .reduce((sum, s) => sum + Number(s.quantite || 0), 0);

    const ventes = transactions
      .filter(t => t.produit === idProduit && filtrerParPeriode(t, "date"))
      .reduce((sum, t) => sum + Number(t.quantite || 0), 0);

    etatParProduit.push({
      materiaux: produit.designation || idProduit,
      reception: receptions,
      vente: ventes,
      reste: receptions - ventes
    });
  }

  return etatParProduit;
}

async function genererInfosClients() {
  const clients = await DBManager.getAll("partenaire");
  const paniers = await DBManager.getAll("panier");
  const produits = await DBManager.getAll("produit");
  const transactions = await DBManager.getAll("transaction");
  const paiements = await DBManager.getAll("paiements");

  const resultat = clients.map(client => {
    const paniersClient = paniers.filter(p => p.code === client.id);

    let totalAchat = 0;
    let totalAvance = 0;
    let derniereDate = "";

    paniersClient.forEach(panier => {
      const transPanier = transactions.filter(t => t.panier === panier.id);
      const paiementPanier = paiements.filter(p => p.panier === panier.id);

      transPanier.forEach(t => {
        const prod = produits.find(p => p.id === t.produit);
        if (prod) {
          totalAchat += Number(t.quantite) * Number(prod.pu);
        }
      });

      paiementPanier.forEach(p => {
        totalAvance += Number(p.montant);
      });

      if (panier.date && panier.date > derniereDate) {
        derniereDate = panier.date;
      }
    });

    return {
      nom: client.nom,
      prenom: client.prenom,
      telephone: client.telephone,
      date: derniereDate,
      achat: totalAchat,
      avance: totalAvance,
      balance: totalAchat - totalAvance
    };
  });

  return resultat;
}

async function crypterMotDePasse(motDePasse) {
  const encoder = new TextEncoder();
  const data = encoder.encode(motDePasse);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}


const creerLicence = `
  <fieldset id="fieldset">
    <legend id="frm_entite">Générateur de fichier de licence </legend>
    <form id="formulaire" class="formulaire">
      <p>
        <label>Requête du client</label>
       <textarea name="commandeLicence" id="commandeLicence" rows="4"></textarea>
      </p>
      <button >Générer le fichier</button>
    </form>
  </fieldset>
`;

const register = `
<fieldset>
<form id="loginUser" class="triple">
<p>
  <label for="ninu"><b>Identification</b></label>
  <input type="text" placeholder="Identification" name="ninu" id="ninu" required>
</p>
<p class="notshow" id="forpass">
  <label for="psw"><b>Password</b></label>
  <input type="password" placeholder="Enter Password" name="psw" id="psw">
</p>
<p class="notshow" id="forpassrepeat">
  <label for="psw_repeat"><b>Repeat Password</b></label>
  <input type="password" placeholder="Repeat Password" name="psw_repeat" id="psw_repeat" >
</p>
<button type="submit" class="registerbtn">Register</button></form></fieldset>`;

const resetPasword = `
<fieldset>
<form id="resetPassword" class="triple">
<p>
  <label for="nom">Nom du client :</label>
   <input type="text" id="nom" name="nom" placeholder="Nom du client" required>
</p>
<p>
  <label for="prenom">Prénom du client :</label>
  <input type="text" id="prenom" name="prenom" placeholder="Prénom du client" required>
</p>
<p>
  <label for="ninu">NINU :</label>
   <input type="text" id="ninu" name="ninu" placeholder="Numero Identification National Unique" required>
</p>
<p>
  <label for="plafond">Dernier chiffre d’affaires prévu :</label>
 <input type="number" id="plafond" name="plafond" placeholder="2,000,000 GHT" required>
</p>
<p id="forpass">
  <label for="psw"><b>Password</b></label>
  <input type="password" placeholder="Enter Password" name="psw" id="psw"  required>
</p>
<p id="forpassrepeat">
  <label for="psw_repeat"><b>Repeat Password</b></label>
  <input type="password" placeholder="Repeat Password" name="psw_repeat" id="psw_repeat"  required>
</p>
<button type="submit" class="resetbtn">Reset password</button></fieldset>`;

async function afficherPaniersClient(idClient) {
  const paniers = await DBManager.getAll("panier");
  const paniersClient = paniers.filter(p => p.code === idClient);

  const container = document.getElementById("cart");
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

function boutonAdd(obj, contexte) {
  const btnNouveau = document.createElement("button");
  btnNouveau.innerHTML = "+";
  btnNouveau.title = contexte;
  btnNouveau.classList.add("btn-flottant");
  btnNouveau.dataset.code = obj.id || "";
  if (contexte === "transaction") {
    const aside = document.getElementById("new_btn");
    if (aside && aside.children.length > 0) {
      aside.children[0].remove(); // Supprime le 2ᵉ enfant
    }
    aside.appendChild(btnNouveau);
    btnNouveau.style.color = "#006699";
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

async function afficherFormulaireLivraison(transaction) {
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

async function afficherRapport(rapport, zone) {

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

    const rem = (balance > vente * 0.25) ? 'class="danger"' : 'class="warning"';

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

function afficherEtatStock(etat, contenair) {
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

function afficherTableauClients(donnees, zone) {
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
    const rem = (c.balance > c.achat * 0.25) ? 'class="danger"' : 'class="warning"';
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

