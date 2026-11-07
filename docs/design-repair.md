# Portfolio design repair

Keep the existing grid, typography, page theme and card dimensions. Restore the piano as white and black keys with playable native buttons. Keep sports artwork inside the rounded card; fetch details only after opening Infos. Failed requests preserve the illustration and use the existing shared cache/backoff limits.

Football details show the last covered finished result and the next covered scheduled match together. Unknown scores stay unknown. France access was denied by the configured provider during the preceding integration check; the official calendar remains available. F1 uses published practice, qualifying, sprint and race sessions, plus a separate last-race result snapshot. No invented statistics.

Language rows include local French, British and Spanish flags alongside language names; flags are supplementary visual cues, not the language label. Search is a compact, closed disclosure. Legacy projects retain their direct link and spacing; projects with case-study fields retain their extra actions.

## Linktree comparison

| Capability | Tiles |
| --- | --- |
| QR profile sharing and PNG download | Added; locally generated with vendored MIT qrcodejs |
| Save contact to device | Added; vCard with escaped profile fields |
| Native sharing / copy link | Existing; canonical profile URL retained |
| Lead capture, embeds, link scheduling, page/click statistics | Already present; not duplicated |
| Shops, checkout and paid products | Deferred: no payment provider or product inventory configured |

QR source: https://github.com/davidshimjs/qrcodejs (04f46c6a0708418cb7b96fc563eacae0fbf77674). License beside the vendored script. No external QR service receives profile URLs.

## Validation

21 Node checks pass, covering keyboard structure across sizes, language flags/escaping, legacy project navigation, vCard field injection, next-session ordering, shared fetches, null football scores and delayed coverage. PHP normalization fixtures are included; PHP CLI is unavailable in this workspace. CI runs both Node and PHP suites. Browser visual verification is blocked: the portfolio subdomain has a TLS failure and the browser disallows local-file previews. These changes are prepared for review, not claimed as visually verified or deployed.
