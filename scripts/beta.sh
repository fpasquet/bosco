#!/bin/sh
# make beta : construit le paquet .deb d'une branche dans un worktree à part, remis à neuf à chaque essai, puis
# l'installe à la place de l'application. Le dépôt courant n'est pas touché.
#   BRANCH  branche locale, sinon d'origin (ou origin/<branche>, un commit) ; vide : la branche courante
#   BETA_DIR  worktree de construction (~/.cache/bosco/beta)
set -eu

BETA_DIR=${BETA_DIR:-$HOME/.cache/bosco/beta}
BRANCH=${BRANCH:-}
MAKE=${MAKE:-make}

if [ -z "$BRANCH" ]; then
  # Sans BRANCH : le dernier commit de la branche courante, sans ce qui n'est pas encore commité
  name=$(git symbolic-ref --short --quiet HEAD || echo HEAD)
  commit=$(git rev-parse HEAD)
  if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    echo "warning: uncommitted changes are not in the package, commit them to try them" >&2
  fi
else
  git fetch --quiet origin || echo "warning: could not fetch origin, using the branches known locally" >&2
  name=$BRANCH
  if commit=$(git rev-parse --verify --quiet "$BRANCH^{commit}"); then
    # Une branche locale en retard sur celle d'origin : on la construit telle quelle, mais on le dit
    remote=$(git rev-parse --verify --quiet "refs/remotes/origin/$BRANCH^{commit}" || true)
    if [ -n "$remote" ] && [ "$remote" != "$commit" ] && git merge-base --is-ancestor "$commit" "$remote"; then
      echo "warning: $BRANCH is behind origin/$BRANCH, building the local one (BRANCH=origin/$BRANCH for the pushed one)" >&2
    fi
  elif commit=$(git rev-parse --verify --quiet "refs/remotes/origin/$BRANCH^{commit}"); then
    name=origin/$BRANCH
  else
    echo "error: no branch $BRANCH, neither locally nor on origin" >&2
    exit 1
  fi
fi

echo "Building $name ($(git rev-parse --short "$commit")) in $BETA_DIR"
git worktree prune
if [ -d "$BETA_DIR" ]; then
  git -C "$BETA_DIR" checkout --quiet --force --detach "$commit"
else
  git worktree add --quiet --detach "$BETA_DIR" "$commit"
fi
# Remis à neuf : un node_modules gardé d'un essai à l'autre peut garder un paquet installé à moitié, que pnpm install
# croit à jour tant que le lockfile ne change pas
git -C "$BETA_DIR" clean -ffdxq

cd "$BETA_DIR"
pnpm install --frozen-lockfile
# Dans un worktree neuf, pnpm reprend Electron de son cache sans lancer le script qui télécharge son binaire
(cd apps/desktop && node node_modules/electron/install.js)
"$MAKE" desktop-package desktop-package-install
