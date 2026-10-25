# LazyProof v0.3

This static site runs entirely in the browser. The user imports a Word QRE and Confirmit XML/ZIP, chooses the intended XML language and sees the nonmatching findings.

The XML parser compares only fields explicitly defined for the selected language. Fields missing for that language are marked as unresolved and not filled from another language, even if Confirmit runtime would fall back while rendering; runtime fallback is outside this source comparison.

The question wording panel shows the **complete** available QRE and CF texts, with matching words in green and changed words in red. Only differences and review items are shown, while exact matches stay hidden. The CSV includes full text for wording discrepancies.

The included demo study is for technical QA only and contains confidential questionnaire and survey source material; no demo file is deployed with this application.