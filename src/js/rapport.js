export class Rapport {
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

