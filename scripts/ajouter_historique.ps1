# À exécuter DEPUIS le dossier du repo (C:\Users\ECC\Downloads\netix-paie)
# Lance ce script avec : .\ajouter_historique.ps1

$src = "C:\Users\ECC\Downloads\New folder"

Write-Host "Création des dossiers..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "app\salaries\[id]\historique" | Out-Null
New-Item -ItemType Directory -Force -Path "app\historique" | Out-Null

Write-Host "Copie des fichiers..." -ForegroundColor Cyan
Copy-Item -LiteralPath "$src\historique_salarie_page.tsx" -Destination "app\salaries\[id]\historique\page.tsx" -Force
Copy-Item -LiteralPath "$src\BulletinRowActions.tsx"      -Destination "app\salaries\[id]\historique\BulletinRowActions.tsx" -Force
Copy-Item -LiteralPath "$src\historique_index_page.tsx"   -Destination "app\historique\page.tsx" -Force
Copy-Item -LiteralPath "$src\HistoriqueSelecteur.tsx"     -Destination "app\historique\HistoriqueSelecteur.tsx" -Force

Write-Host ""
Write-Host "Fichiers copiés avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT : il te reste 3 modifications MANUELLES à faire toi-même :" -ForegroundColor Yellow
Write-Host "  1. app\salaries\actions.ts       -> coller AJOUT_actions.ts.txt à la fin du fichier"
Write-Host "  2. components\Sidebar.tsx        -> appliquer MODIF_Sidebar.txt"
Write-Host "  3. app\salaries\page.tsx         -> appliquer MODIF_salaries_page.txt"
Write-Host ""
Write-Host "Une fois fait, lance :"
Write-Host "  git add ."
Write-Host "  git commit -m 'Ajout de historique des bulletins'"
Write-Host "  git push"