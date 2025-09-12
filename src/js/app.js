import { config } from "./config.js";
import { DBManager } from "./db";
import { FormulaireFactory } from "./formulaireFactory.js";
import { TableauFactory } from "./tableauFactory.js";
import { afficherMessage, calculerEtatStock, creerLicence, crypterMotDePasse, genererInfosClients, genererRapport, register, resetPasword } from "./utils.js";
import { afficherEtatStock, afficherRapport, afficherTableauClients } from "./ui.js";
// ======================== Gestion de menus ============================

document.addEventListener("DOMContentLoaded", async () => {
    const zoneFormulaire = document.getElementById("fieldset");
    const login = document.getElementById("login");
    // Ton code d'initialisation
    await DBManager.init();

    // verifierHeureLocale();

    // const dernier = await DBManager.getDerniereLicence();
    //=============temporaire=========================
    // const decoded = JSON.parse(atob(dernier.id));
    // console.log(decoded);
    // const getAllPlafond = await DBManager.getAllPlafond();
    // console.log(getAllPlafond);
    // Je dois ajouter un password
    // const verifier = await DBManager.verifieNINU("1021248690");
    // verifier.password = "Edutech";
    // console.log(verifier);
    //=============temporaire=========================

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
                                }else{
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
    document.getElementById("btn-dashboard").addEventListener("click", async () => {
        location.reload();
    });

    //Écouteur sur le bouton nouveau
    const partenaire = document.getElementById("btn-nouveau");
    partenaire.addEventListener("click", (e) => {
        e.preventDefault();
        zoneFormulaire.classList.add("notshow");
        sommaire.classList.add("notshow");

        document.getElementById("menu").innerHTML = "";
        const aside = document.getElementById("lateral");
        if (aside && aside.children.length > 1) {
            aside.children[1].remove(); // Supprime le 2ᵉ enfant
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
        document.getElementById("menu").innerHTML = "";

        const aside = document.getElementById("lateral");
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
        document.getElementById("menu").innerHTML = "";

        const aside = document.getElementById("lateral");
        if (aside && aside.children.length > 1) {
            aside.children[1].remove(); // Supprime le 2ᵉ enfant
        }

        boutonAdd({}, "stock");
        afficherTableau("stock");
    })

    // Écouteur sur le bouton stock
    const lic = document.getElementById("creerLic");
    lic.addEventListener("click", (e) => {
        e.preventDefault();
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
        btnNouveau.className = "btn-flottant";
        btnNouveau.title = contexte;
        btnNouveau.dataset.code = obj.id || "";
        if (contexte === "transaction") {
            document.getElementById("lateral").appendChild(btnNouveau);
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

