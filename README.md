# Deprecated

This package was designed to address https://github.com/zeit/now-cli/issues/969

There is now an easier way, see: https://github.com/zeit/now-cli/issues/969#issuecomment-366097240

```
now rm <name> --safe
```

# now-replace

Changes an alias to a new deployment, removing the old deployment

## Install
```
yarn add now-replace
```

## Usage

```
now-replace [alias] [deployment]
```

## Example

```
now-replace app-alias $(now)
```
