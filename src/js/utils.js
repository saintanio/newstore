import { DBManager } from "./db.js";
import { Rapport } from "./rapport.js";


export function ouvrirApercuHTML(titre, contenuHTML, orientation = "portrait") {
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

export function years() {
  const date = new Date();
  const year = date.getFullYear();
  const n1 = ((year * 1) - 2) + "-" + ((year * 1) - 1);
  const n2 = ((year * 1) - 1) + "-" + ((year * 1));
  const n3 = (year * 1) + "-" + ((year * 1) + 1);
  const n4 = ((year * 1) + 1) + "-" + ((year * 1) + 2);
  return [n1, n2, n3, n4];
}

export function afficherMessage(texte, duree = 3000) {
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

export async function chargerFirebase() {
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

export const messageInfos = `
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

export const evaluations = [
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

export async function calculerBalance(codePanier) {
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

export async function getResteALivrer(panierId) {
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

export async function genererRapport() {
  await DBManager.init();
  const rapport = new Rapport();

  const stocks = await DBManager.getAll("stock");
  stocks.forEach(s => rapport.ajouterStock(s));

  const paiements = await DBManager.getAll("paiements");
  paiements.forEach(p => rapport.ajouterPaiement(p));

   return rapport.getRapport();
}


export async function calculerRecetteParTransactions(periode) {
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

// export async function verifierHeureLocale() {
//   try {
//     const response = await fetch("https://worldtimeapi.org/api/ip");
//     const data = await response.json();

//     const heureServeur = new Date(data.datetime);
//     const heureLocale = new Date();

//     const ecartMs = Math.abs(heureServeur - heureLocale);
//     const ecartMinutes = Math.floor(ecartMs / 60000);

//     if (ecartMinutes > 5) {
//       alert("⏰ L'heure de votre ordinateur semble incorrecte !");
//     } else {
//       // console.log("✔ L'heure de votre ordinateur est correcte.");
//     }
//   } catch (error) {
//     // console.error("Erreur lors de la vérification de l'heure :", error);
//   }
// }

export async function calculerEtatStock(periode) {
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

    const receptions = stock
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

export async function genererInfosClients() {
  await DBManager.init();
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
      prenom: client.prenom,
      telephone: client.telephone,
      date: derniereDate,
      achat: totalAchat,
      avance: totalAvance,
      balance: totalAchat - totalAvance
    };
  });

  return resultat;
}

export async function crypterMotDePasse(motDePasse) {
  const encoder = new TextEncoder();
  const data = encoder.encode(motDePasse);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}


export const creerLicence = `
  <fieldset id="fieldset">
    <legend id="frm_entite">Générateur de lien de licence </legend>
    <form id="formulaire" class="formulaire">
      <p>
        <label>Requête du client</label>
       <textarea name="commandeLicence" id="commandeLicence" rows="4"></textarea>
      </p>
      <button >Générer le fichier</button>
    </form>
    <div id="lien"></div>
  </fieldset>
`;

export const register = `
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

export const resetPasword = `
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
