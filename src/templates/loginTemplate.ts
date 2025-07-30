const loginTemplate = `
<div class="container" style="padding: 24px;">
      <img src="https://github.com/TristanRenard/wokedex-api/blob/develop/.github/images/image.png?raw=true" alt="Logo Wokedex - Application de création de cartes personnalisées" style="width: 100%;" role="img" aria-label="Logo de l'application Wokedex"/>
        
      <p style="font-family: 'Inter', sans-serif; font-size: 16px; line-height: 1.5; padding-top: 80px; text-align: justify;">
        Bonjour, bienvenue ou bon retour parmi nous, 
      </br>
        Si cette tentative de connexion est légitime, vous pouvez continuer et cliquer sur le bouton ci-dessous. Si cette tentative de connexion n'est pas légitime, veuillez ignorer cet email. Pour protéger votre vie privée, nous utilisons un système de chiffrement qui rend vos données personnelles anonymes et non récupérables. Nous ne conservons donc qu'un nom d'utilisateur que vous avez choisi lors de votre première connexion.
        </p>
        <div style="padding-top: 80px; text-align: center;">
          <a href="{{verifyURL}}" style="background: linear-gradient(98deg, #FDF0F2 -0.36%, #F7B8C3 9.57%, #77CDEB 19.29%, #624C32 29.12%, #110302 38.95%, #E83942 48.78%, #F26E41 58.61%, #FEDF32 68.44%, #56AC5C 78.27%, #4063D8 88.1%, #7B3BC1 97.92%); color: #fff; padding: 16px 48px; border-radius: 8px; text-decoration: none; font-family: 'Inter', sans-serif; font-size: 24px; line-height: 1.5; text-align: center; font-weight: 900;" role="button" aria-label="Bouton de connexion sécurisée">
            Me connecter
          </a>
        </div>
        <p style="font-family: 'Inter', sans-serif; font-size: 16px; line-height: 1.5; padding-top: 80px; text-align: justify;">
          Conformément au RGPD, vous pouvez supprimer les données personnelles liées à votre compte, c'est-à-dire dans ce cas-ci, votre profil avec votre nom d'utilisateur, toutes les cartes créées, ainsi que les tags créés. Cette action est irréversible, en cas de suppression accidentelle aucune donnée ne pourra être récupérée. Si vous êtes une personnalité publique et que votre pseudo habituel est déjà utilisé sur notre plateforme, veuillez me contacter pour examiner la situation au cas par cas.
          </p>
          <table style="width: 100%; padding-top: 80px;" role="presentation">
            <tr>
              <td style="width: 50%; padding-right: 20px;">
                <a href="{{changeUsernameURL}}" style="background: linear-gradient(98deg, #FDF0F2 -0.36%, #F7B8C3 9.57%, #77CDEB 19.29%, #624C32 29.12%, #110302 38.95%, #E83942 48.78%, #F26E41 58.61%, #FEDF32 68.44%, #56AC5C 78.27%, #4063D8 88.1%, #7B3BC1 97.92%); color: #fff; padding: 12px 48px; border-radius: 8px; text-decoration: none; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 1.5; text-align: center; font-weight: 900; display: block; box-sizing: border-box;" role="button" aria-label="Modifier le nom d'utilisateur">
                  Changer mon pseudo
                </a>
              </td>
              <td style="width: 50%; padding-left: 20px;">
                <a href="{{deleteAccountURL}}" style="background: #FF6565; color: #fff; padding: 12px 48px; border-radius: 8px; text-decoration: none; font-family: 'Inter', sans-serif; font-size: 16px; line-height: 1.5; text-align: center; font-weight: 900; display: block; box-sizing: border-box;" role="button" aria-label="Supprimer définitivement le compte utilisateur">
                  Supprimer mon compte
                </a>
              </td>
            </tr>
          </table>
    </div>
    `

export { loginTemplate }
