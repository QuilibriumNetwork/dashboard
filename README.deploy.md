To deploy this, you can do the following:

```bash
# while on the `main` branch
yarn build
rm dist/report.html
git checkout gh-pages
rm -r {assets,images,signer_keys,svg,videos}
mv dist/* .
git add .
git commit -m "<message>" <- edit this to describe what this change will deploy
git push
```