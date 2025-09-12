import { config } from "./config.js";
import { afficherMessage } from "./utils.js";

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
      return _hash(base);
    }
    else if (store === "transaction") {
      return `${data.produit}_${data.panier}`;
    }
    else if (store === "stock") {
      const base =  `${data.produit}_${jour}`;
      return _hash(base);
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

//======================verifieNINU==========================
async verifieNINU(ninuRecherche) {
  const licences = await DBManager.getAll("licence");

  for (const licence of licences) {
    try {
      const jsonStr = atob(licence.id);
      const obj = JSON.parse(jsonStr);

      if (obj.ninu == ninuRecherche) {
        // return true; // trouvé
        return licence; // trouvé
      }
    } catch (e) {
      console.warn("Erreur de décodage:", licence.id, e);
    }
  }
}


}
export const DBManager = new DB("Newstore", Object.keys(config));


