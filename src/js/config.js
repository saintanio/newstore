export const config = {
  partenaire: [
    { name: "nom", id: "nom", type: "text", placeholder: "Nom du partenaire", required: true },
    { name: "prenom", id: "prenom", type: "text", placeholder: "Prenom du partenaire", required: true },
    { name: "telephone", id: "telephone", type: "text", placeholder: "Telephone du partenaire", required: true },
    { name: "ninu", id: "ninu", type: "text", placeholder: "NINU du partenaire"},
    { name: "categorie", id: "categorie", type: "select", options: ["fournisseur", "client"], required: true },
    { name: "adresse", id: "adresse", type: "text", placeholder: "Adresse du partenaire"}
  ],
  
  panier: [
    {name: "code", id: "code", "type": "hidden"},
    {name: "montant",id: "montant","type": "hidden"},
    {name: "balance",id: "balance","type": "hidden"}
  ],
  produit: [
    { name: "designation", id: "designation", type: "text", placeholder: "Designation du produit", required: true },
    { name: "categorie", id: "categorie", type: "select", options: ["Materiau","Nourriture"], required: true },
    { name: "pu",id: "pu", type: "number", placeholder: "Prix unitaire", min: 1, required: true }
  ],
  
  transaction: [
    { name: "produit",id: "produit", type: "select", optionsFrom: "produit", required: true }, // options à remplir dynamiquement
    { name: "quantite",id: "quantite", type: "number", placeholder: "Quantité vendue", min: 1, required: true },
    { name: "panier", id: "panier", "type": "hidden"}
  ],

  stock: [
    { name: "produit",id: "produit", type: "select", optionsFrom: "produit", required: true }, // options à remplir dynamiquement
    { name: "quantite",id: "quantite", type: "number", placeholder: "Quantité achetée", min: 1, required: true },
    { name: "prix",id: "prix", type: "number", placeholder: "Prix d'achat", min: 1, required: true }
  ],

  paiements:[
    {name: "montant",id: "montant",type: "number",min: "10",placeholder: "montant",required: true},
    { name: "panier", id: "panier", "type": "hidden"},
    { name: "par", id: "par", type: "text", placeholder: "par client" }
  ],

livraison: [
  { name: "produit", id: "produit", type: "select", optionsFrom: "produit", required: true },
  { name: "quantite", id: "quantite", type: "number", placeholder: "Quantité livrée", min: 1, maxFromStock: true, required: true },
  { name: "panier", id: "panier", type: "hidden" },
  { name: "date", id: "date", type: "hidden", required: true }
]


};

