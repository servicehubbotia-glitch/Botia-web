// BOTIA — manufacturer contact action for traceability.
(() => {
  "use strict";

  const params = new URLSearchParams(location.search);
  const lang = String(params.get("lang") || document.documentElement.lang || "en")
    .trim().toLowerCase();

  const I18N = {
    en: {
      title: "Ask the company",
      copy: "BOTIA has not found enough public evidence for this product. You can ask the company directly.",
      button: "Write to the company",
      followup: "If the company sends you documentation, contact BOTIA and send it to us. We will review it before adding it as evidence.",
      reply_title: "If the brand replies",
      reply_body: "You can forward its reply to botia.traceability@botia-safefood.com. We will review it and, if it can be verified, add it as evidence citing the brand as the source.",
      reply_privacy: "Your email address is used only to reply to you about that submission. The evidence is published without identifying the person who sent it.",
      subject: "Request for verifiable information about a product",
      greeting: "Hello,",
      intro: "I am contacting you to request verifiable information about the following product:",
      product: "Product", brand: "Brand", market: "Market", ingredient: "Ingredient / point to clarify",
      qHalal: "Could you confirm whether this exact product is covered by a current halal certification? If so, please provide the certifier, certificate number, scope, market and validity dates.",
      qAnimal: "Could you confirm the animal-testing / cruelty-free status that applies to this exact product or brand in this market? If there is an independent certification or audit, please provide the organisation, scope and validity.",
      qWoman: "Could you provide product-specific information about the packaging or food-contact materials for this product, including the material and any available declaration concerning BPA/bisphenols, phthalates, PFAS, coatings or other relevant substances?",
      qGeneric: "Could you provide the documentation that applies specifically to this product, indicating the exact scope, market and validity?",
      docs: "Please attach or link the supporting document, certificate or public record if available.",
      closing: "Thank you."
    },
    es: {
      title: "Pregunta a la compañía",
      copy: "BOTIA no ha encontrado evidencia pública suficiente para este producto. Puedes preguntar directamente a la compañía.",
      button: "Escribe a la compañía",
      followup: "Si la compañía te envía documentación, ponte en contacto con BOTIA y háznosla llegar. La revisaremos antes de incorporarla como evidencia.",
      reply_title: "Si la marca te responde",
      reply_body: "Puedes reenviarnos su respuesta a botia.traceability@botia-safefood.com. La revisaremos y, si es verificable, la incorporaremos como evidencia citando a la marca como fuente.",
      reply_privacy: "Tu dirección de correo se usa únicamente para responderte sobre ese envío. La evidencia se publica sin identificar a quien la envió.",
      subject: "Consulta sobre información verificable de un producto",
      greeting: "Buenos días,",
      intro: "Me pongo en contacto para solicitar información verificable sobre el siguiente producto:",
      product: "Producto", brand: "Marca", market: "Mercado", ingredient: "Ingrediente / punto a aclarar",
      qHalal: "¿Podrían confirmar si este producto exacto está cubierto por una certificación halal vigente? En caso afirmativo, agradecería que indicaran organismo certificador, número de certificado, alcance, mercado y fechas de vigencia.",
      qAnimal: "¿Podrían confirmar qué situación respecto a pruebas en animales / cruelty-free se aplica a este producto exacto o a esta marca en este mercado? Si existe una certificación o auditoría independiente, agradecería organismo, alcance y vigencia.",
      qWoman: "¿Podrían facilitar información específica de este producto sobre su envase o materiales en contacto con alimentos, incluido el material y cualquier declaración disponible sobre BPA/bisfenoles, ftalatos, PFAS, recubrimientos u otras sustancias relevantes?",
      qGeneric: "¿Podrían facilitar la documentación que se aplique específicamente a este producto, indicando alcance exacto, mercado y vigencia?",
      docs: "Si existe, agradecería que adjuntaran o enlazaran el documento, certificado o registro público que lo respalde.",
      closing: "Muchas gracias."
    },
    ar: {
      title: "اسأل الشركة",
      copy: "لم تجد BOTIA أدلة عامة كافية لهذا المنتج. يمكنك سؤال الشركة مباشرة.",
      button: "اكتب إلى الشركة",
      followup: "إذا أرسلت لك الشركة مستندات، تواصل مع BOTIA وأرسلها إلينا. سنراجعها قبل إضافتها كدليل.",
      reply_title: "إذا ردّت العلامة التجارية",
      reply_body: "يمكنك إعادة توجيه ردها إلينا على botia.traceability@botia-safefood.com. سنراجعه، وإذا أمكن التحقق منه، سنضيفه كدليل مع ذكر العلامة التجارية كمصدر.",
      reply_privacy: "يُستخدم عنوان بريدك الإلكتروني فقط للرد عليك بشأن هذا الإرسال. تُنشر الأدلة من دون الكشف عن هوية الشخص الذي أرسلها.",
      subject: "طلب معلومات قابلة للتحقق عن منتج",
      greeting: "مرحبًا،",
      intro: "أتواصل معكم لطلب معلومات قابلة للتحقق عن المنتج التالي:",
      product: "المنتج", brand: "العلامة التجارية", market: "السوق", ingredient: "المكوّن / النقطة المطلوب توضيحها",
      qHalal: "هل يمكنكم تأكيد ما إذا كان هذا المنتج بعينه مشمولًا بشهادة حلال سارية؟ إذا كان كذلك، يرجى تزويدي بجهة التصديق ورقم الشهادة والنطاق والسوق وتواريخ الصلاحية.",
      qAnimal: "هل يمكنكم تأكيد حالة الاختبار على الحيوانات / الخلو من القسوة التي تنطبق على هذا المنتج بعينه أو هذه العلامة التجارية في هذا السوق؟ وإذا كانت هناك شهادة أو مراجعة مستقلة، يرجى ذكر الجهة والنطاق والصلاحية.",
      qWoman: "هل يمكنكم تزويدي بمعلومات خاصة بهذا المنتج عن العبوة أو المواد الملامسة للغذاء، بما في ذلك نوع المادة وأي تصريح متاح بشأن BPA/البيسفينولات أو الفثالات أو PFAS أو الطلاءات أو غيرها من المواد ذات الصلة؟",
      qGeneric: "هل يمكنكم تزويدي بالوثائق التي تنطبق تحديدًا على هذا المنتج مع بيان النطاق الدقيق والسوق والصلاحية؟",
      docs: "يرجى إرفاق أو ربط المستند أو الشهادة أو السجل العام الداعم إن كان متاحًا.",
      closing: "شكرًا لكم."
    },
    de: {
      title: "Unternehmen fragen",
      copy: "BOTIA hat für dieses Produkt keine ausreichenden öffentlichen Nachweise gefunden. Du kannst das Unternehmen direkt fragen.",
      button: "Unternehmen anschreiben",
      followup: "Wenn das Unternehmen dir Unterlagen sendet, kontaktiere BOTIA und leite sie an uns weiter. Wir prüfen sie, bevor wir sie als Nachweis aufnehmen.",
      reply_title: "Wenn die Marke dir antwortet",
      reply_body: "Du kannst uns die Antwort an botia.traceability@botia-safefood.com weiterleiten. Wir prüfen sie und nehmen sie, wenn sie überprüfbar ist, als Nachweis auf und nennen die Marke als Quelle.",
      reply_privacy: "Deine E-Mail-Adresse wird nur verwendet, um dir zu dieser Einsendung zu antworten. Der Nachweis wird veröffentlicht, ohne die Person zu identifizieren, die ihn eingesandt hat.",
      subject: "Anfrage zu überprüfbaren Produktinformationen",
      greeting: "Guten Tag,",
      intro: "ich möchte überprüfbare Informationen zu folgendem Produkt anfragen:",
      product: "Produkt", brand: "Marke", market: "Markt", ingredient: "Zutat / zu klärender Punkt",
      qHalal: "Können Sie bestätigen, ob genau dieses Produkt von einer aktuell gültigen Halal-Zertifizierung erfasst ist? Falls ja, nennen Sie bitte Zertifizierungsstelle, Zertifikatsnummer, Geltungsbereich, Markt und Gültigkeitsdaten.",
      qAnimal: "Können Sie bestätigen, welcher Status bezüglich Tierversuchen / Cruelty-free für genau dieses Produkt oder diese Marke in diesem Markt gilt? Falls eine unabhängige Zertifizierung oder Prüfung besteht, nennen Sie bitte Organisation, Geltungsbereich und Gültigkeit.",
      qWoman: "Können Sie produktspezifische Informationen zur Verpackung oder zu Lebensmittelkontaktmaterialien bereitstellen, einschließlich Material und verfügbarer Angaben zu BPA/Bisphenolen, Phthalaten, PFAS, Beschichtungen oder anderen relevanten Stoffen?",
      qGeneric: "Können Sie Unterlagen bereitstellen, die speziell für dieses Produkt gelten und den genauen Geltungsbereich, Markt und die Gültigkeit angeben?",
      docs: "Bitte fügen Sie, falls verfügbar, das unterstützende Dokument, Zertifikat oder den öffentlichen Registereintrag bei oder verlinken Sie ihn.",
      closing: "Vielen Dank."
    },
    fr: {
      title: "Demander à l’entreprise",
      copy: "BOTIA n’a pas trouvé suffisamment de preuves publiques pour ce produit. Vous pouvez interroger directement l’entreprise.",
      button: "Écrire à l’entreprise",
      followup: "Si l’entreprise vous envoie des documents, contactez BOTIA et transmettez-les-nous. Nous les examinerons avant de les intégrer comme preuve.",
      reply_title: "Si la marque vous répond",
      reply_body: "Vous pouvez nous transférer sa réponse à botia.traceability@botia-safefood.com. Nous l’examinerons et, si elle est vérifiable, nous l’intégrerons comme preuve en citant la marque comme source.",
      reply_privacy: "Votre adresse e-mail est utilisée uniquement pour vous répondre au sujet de cet envoi. La preuve est publiée sans identifier la personne qui l’a transmise.",
      subject: "Demande d’informations vérifiables sur un produit",
      greeting: "Bonjour,",
      intro: "Je vous contacte afin d’obtenir des informations vérifiables sur le produit suivant :",
      product: "Produit", brand: "Marque", market: "Marché", ingredient: "Ingrédient / point à clarifier",
      qHalal: "Pouvez-vous confirmer si ce produit précis est couvert par une certification halal actuellement valide ? Si oui, merci d’indiquer l’organisme certificateur, le numéro du certificat, la portée, le marché et les dates de validité.",
      qAnimal: "Pouvez-vous confirmer le statut relatif aux tests sur les animaux / cruelty-free applicable à ce produit précis ou à cette marque sur ce marché ? S’il existe une certification ou un audit indépendant, merci d’indiquer l’organisme, la portée et la validité.",
      qWoman: "Pouvez-vous fournir des informations propres à ce produit sur son emballage ou ses matériaux au contact des aliments, notamment le matériau et toute déclaration disponible concernant le BPA/bisphénols, les phtalates, les PFAS, les revêtements ou d’autres substances pertinentes ?",
      qGeneric: "Pouvez-vous fournir la documentation applicable spécifiquement à ce produit, en précisant la portée exacte, le marché et la validité ?",
      docs: "Merci de joindre ou de fournir un lien vers le document, certificat ou registre public justificatif s’il est disponible.",
      closing: "Merci."
    },
    id: {
      title: "Tanyakan kepada perusahaan",
      copy: "BOTIA belum menemukan bukti publik yang cukup untuk produk ini. Anda dapat bertanya langsung kepada perusahaan.",
      button: "Tulis ke perusahaan",
      followup: "Jika perusahaan mengirimkan dokumen, hubungi BOTIA dan kirimkan kepada kami. Kami akan meninjaunya sebelum menambahkannya sebagai bukti.",
      reply_title: "Jika merek membalas",
      reply_body: "Anda dapat meneruskan balasannya ke botia.traceability@botia-safefood.com. Kami akan meninjaunya dan, jika dapat diverifikasi, memasukkannya sebagai bukti dengan mencantumkan merek sebagai sumber.",
      reply_privacy: "Alamat email Anda hanya digunakan untuk membalas Anda terkait kiriman tersebut. Bukti dipublikasikan tanpa mengidentifikasi orang yang mengirimkannya.",
      subject: "Permintaan informasi produk yang dapat diverifikasi",
      greeting: "Halo,",
      intro: "Saya menghubungi Anda untuk meminta informasi yang dapat diverifikasi mengenai produk berikut:",
      product: "Produk", brand: "Merek", market: "Pasar", ingredient: "Bahan / hal yang perlu diklarifikasi",
      qHalal: "Dapatkah Anda mengonfirmasi apakah produk ini secara tepat tercakup oleh sertifikasi halal yang masih berlaku? Jika ya, mohon berikan lembaga sertifikasi, nomor sertifikat, ruang lingkup, pasar, dan masa berlaku.",
      qAnimal: "Dapatkah Anda mengonfirmasi status pengujian pada hewan / cruelty-free yang berlaku untuk produk ini atau merek ini di pasar tersebut? Jika ada sertifikasi atau audit independen, mohon cantumkan organisasi, ruang lingkup, dan masa berlaku.",
      qWoman: "Dapatkah Anda memberikan informasi khusus produk mengenai kemasan atau bahan kontak pangan, termasuk jenis bahan dan pernyataan yang tersedia mengenai BPA/bisfenol, ftalat, PFAS, pelapis, atau zat relevan lainnya?",
      qGeneric: "Dapatkah Anda memberikan dokumentasi yang secara khusus berlaku untuk produk ini, termasuk ruang lingkup, pasar, dan masa berlakunya?",
      docs: "Jika tersedia, mohon lampirkan atau berikan tautan ke dokumen, sertifikat, atau catatan publik pendukung.",
      closing: "Terima kasih."
    },
    it: {
      title: "Chiedi all’azienda",
      copy: "BOTIA non ha trovato prove pubbliche sufficienti per questo prodotto. Puoi chiedere direttamente all’azienda.",
      button: "Scrivi all’azienda",
      followup: "Se l’azienda ti invia documentazione, contatta BOTIA e inoltracela. La esamineremo prima di aggiungerla come evidenza.",
      reply_title: "Se il marchio ti risponde",
      reply_body: "Puoi inoltrarci la risposta a botia.traceability@botia-safefood.com. La esamineremo e, se verificabile, la incorporeremo come evidenza citando il marchio come fonte.",
      reply_privacy: "Il tuo indirizzo e-mail viene utilizzato solo per risponderti in merito a quell’invio. L’evidenza viene pubblicata senza identificare chi l’ha inviata.",
      subject: "Richiesta di informazioni verificabili su un prodotto",
      greeting: "Buongiorno,",
      intro: "Vi contatto per richiedere informazioni verificabili sul seguente prodotto:",
      product: "Prodotto", brand: "Marca", market: "Mercato", ingredient: "Ingrediente / punto da chiarire",
      qHalal: "Potreste confermare se questo specifico prodotto è coperto da una certificazione halal attualmente valida? In caso affermativo, indicate organismo certificatore, numero del certificato, ambito, mercato e date di validità.",
      qAnimal: "Potreste confermare lo stato relativo ai test sugli animali / cruelty-free applicabile a questo specifico prodotto o marchio in questo mercato? Se esiste una certificazione o un audit indipendente, indicate organismo, ambito e validità.",
      qWoman: "Potreste fornire informazioni specifiche del prodotto sull’imballaggio o sui materiali a contatto con gli alimenti, compreso il materiale e qualsiasi dichiarazione disponibile relativa a BPA/bisfenoli, ftalati, PFAS, rivestimenti o altre sostanze pertinenti?",
      qGeneric: "Potreste fornire la documentazione applicabile specificamente a questo prodotto, indicando ambito esatto, mercato e validità?",
      docs: "Se disponibile, allegate o indicate il link al documento, certificato o registro pubblico di supporto.",
      closing: "Grazie."
    },
    nl: {
      title: "Vraag het bedrijf",
      copy: "BOTIA heeft voor dit product niet genoeg openbaar bewijs gevonden. Je kunt het bedrijf rechtstreeks benaderen.",
      button: "Schrijf het bedrijf",
      followup: "Als het bedrijf documentatie stuurt, neem dan contact op met BOTIA en stuur die naar ons door. Wij beoordelen ze voordat we ze als bewijs opnemen.",
      reply_title: "Als het merk je antwoordt",
      reply_body: "Je kunt het antwoord doorsturen naar botia.traceability@botia-safefood.com. We beoordelen het en nemen het, als het verifieerbaar is, op als bewijs met het merk als bron.",
      reply_privacy: "Je e-mailadres wordt alleen gebruikt om je over die inzending te antwoorden. Het bewijs wordt gepubliceerd zonder de persoon te identificeren die het heeft ingestuurd.",
      subject: "Verzoek om verifieerbare productinformatie",
      greeting: "Goedendag,",
      intro: "Ik neem contact met u op om verifieerbare informatie te vragen over het volgende product:",
      product: "Product", brand: "Merk", market: "Markt", ingredient: "Ingrediënt / te verduidelijken punt",
      qHalal: "Kunt u bevestigen of dit exacte product onder een momenteel geldige halalcertificering valt? Zo ja, vermeld dan de certificerende instantie, het certificaatnummer, de reikwijdte, de markt en de geldigheidsdata.",
      qAnimal: "Kunt u bevestigen welke status met betrekking tot dierproeven / cruelty-free voor dit exacte product of merk op deze markt geldt? Als er een onafhankelijke certificering of audit bestaat, vermeld dan de organisatie, reikwijdte en geldigheid.",
      qWoman: "Kunt u productspecifieke informatie geven over de verpakking of voedselcontactmaterialen, waaronder het materiaal en beschikbare verklaringen over BPA/bisfenolen, ftalaten, PFAS, coatings of andere relevante stoffen?",
      qGeneric: "Kunt u de documentatie verstrekken die specifiek op dit product van toepassing is, met de exacte reikwijdte, markt en geldigheid?",
      docs: "Voeg indien beschikbaar het ondersteunende document, certificaat of openbare register toe of geef een link.",
      closing: "Dank u wel."
    },
    pl: {
      title: "Zapytaj firmę",
      copy: "BOTIA nie znalazła wystarczających publicznych dowodów dotyczących tego produktu. Możesz zapytać firmę bezpośrednio.",
      button: "Napisz do firmy",
      followup: "Jeśli firma prześle Ci dokumentację, skontaktuj się z BOTIA i przekaż ją nam. Sprawdzimy ją przed dodaniem jako dowód.",
      reply_title: "Jeśli marka Ci odpowie",
      reply_body: "Możesz przesłać nam jej odpowiedź na botia.traceability@botia-safefood.com. Sprawdzimy ją i, jeśli będzie możliwa do zweryfikowania, dodamy ją jako dowód, wskazując markę jako źródło.",
      reply_privacy: "Twój adres e-mail jest używany wyłącznie do odpowiedzi dotyczącej tego zgłoszenia. Dowód jest publikowany bez identyfikowania osoby, która go przesłała.",
      subject: "Prośba o weryfikowalne informacje o produkcie",
      greeting: "Dzień dobry,",
      intro: "Zwracam się z prośbą o weryfikowalne informacje dotyczące następującego produktu:",
      product: "Produkt", brand: "Marka", market: "Rynek", ingredient: "Składnik / kwestia do wyjaśnienia",
      qHalal: "Czy mogą Państwo potwierdzić, czy ten konkretny produkt jest objęty aktualnie ważnym certyfikatem halal? Jeśli tak, proszę podać jednostkę certyfikującą, numer certyfikatu, zakres, rynek oraz daty ważności.",
      qAnimal: "Czy mogą Państwo potwierdzić status dotyczący testów na zwierzętach / cruelty-free, który dotyczy tego konkretnego produktu lub marki na tym rynku? Jeśli istnieje niezależny certyfikat lub audyt, proszę podać organizację, zakres i ważność.",
      qWoman: "Czy mogą Państwo przekazać informacje dotyczące tego konkretnego produktu na temat opakowania lub materiałów przeznaczonych do kontaktu z żywnością, w tym materiału oraz dostępnych oświadczeń dotyczących BPA/bisfenoli, ftalanów, PFAS, powłok lub innych istotnych substancji?",
      qGeneric: "Czy mogą Państwo przekazać dokumentację odnoszącą się konkretnie do tego produktu, z podaniem dokładnego zakresu, rynku i ważności?",
      docs: "Jeśli to możliwe, proszę załączyć lub podać link do dokumentu, certyfikatu albo publicznego rejestru potwierdzającego te informacje.",
      closing: "Dziękuję."
    },
    pt: {
      title: "Pergunte à empresa",
      copy: "A BOTIA não encontrou evidência pública suficiente para este produto. Pode perguntar diretamente à empresa.",
      button: "Escrever à empresa",
      followup: "Se a empresa lhe enviar documentação, contacte a BOTIA e envie-a para nós. Iremos analisá-la antes de a incorporar como evidência.",
      reply_title: "Se a marca lhe responder",
      reply_body: "Pode encaminhar-nos a resposta para botia.traceability@botia-safefood.com. Iremos analisá-la e, se for verificável, incorporá-la como evidência citando a marca como fonte.",
      reply_privacy: "O seu endereço de e-mail é utilizado apenas para lhe responder sobre esse envio. A evidência é publicada sem identificar quem a enviou.",
      subject: "Pedido de informação verificável sobre um produto",
      greeting: "Bom dia,",
      intro: "Entro em contacto para solicitar informação verificável sobre o seguinte produto:",
      product: "Produto", brand: "Marca", market: "Mercado", ingredient: "Ingrediente / ponto a esclarecer",
      qHalal: "Podem confirmar se este produto exato está abrangido por uma certificação halal atualmente válida? Em caso afirmativo, indiquem o organismo certificador, número do certificado, âmbito, mercado e datas de validade.",
      qAnimal: "Podem confirmar o estatuto relativo a testes em animais / cruelty-free aplicável a este produto exato ou a esta marca neste mercado? Se existir uma certificação ou auditoria independente, indiquem a organização, o âmbito e a validade.",
      qWoman: "Podem fornecer informação específica deste produto sobre a embalagem ou materiais em contacto com alimentos, incluindo o material e qualquer declaração disponível sobre BPA/bisfenóis, ftalatos, PFAS, revestimentos ou outras substâncias relevantes?",
      qGeneric: "Podem fornecer a documentação que se aplica especificamente a este produto, indicando o âmbito exato, o mercado e a validade?",
      docs: "Se disponível, agradeço que anexem ou indiquem o link para o documento, certificado ou registo público de suporte.",
      closing: "Muito obrigada/o."
    },
    ro: {
      title: "Întreabă compania",
      copy: "BOTIA nu a găsit suficiente dovezi publice pentru acest produs. Poți întreba direct compania.",
      button: "Scrie companiei",
      followup: "Dacă firma îți trimite documente, contactează BOTIA și trimite-ni-le. Le vom verifica înainte de a le adăuga drept dovadă.",
      reply_title: "Dacă marca îți răspunde",
      reply_body: "Ne poți redirecționa răspunsul la botia.traceability@botia-safefood.com. Îl vom verifica și, dacă poate fi verificat, îl vom include ca dovadă citând marca drept sursă.",
      reply_privacy: "Adresa ta de e-mail este folosită doar pentru a-ți răspunde cu privire la această trimitere. Dovada este publicată fără a identifica persoana care a trimis-o.",
      subject: "Solicitare de informații verificabile despre un produs",
      greeting: "Bună ziua,",
      intro: "Vă contactez pentru a solicita informații verificabile despre următorul produs:",
      product: "Produs", brand: "Marcă", market: "Piață", ingredient: "Ingredient / aspect de clarificat",
      qHalal: "Puteți confirma dacă acest produs exact este acoperit de o certificare halal valabilă în prezent? Dacă da, vă rog să indicați organismul de certificare, numărul certificatului, domeniul, piața și datele de valabilitate.",
      qAnimal: "Puteți confirma statutul privind testarea pe animale / cruelty-free aplicabil acestui produs exact sau acestei mărci pe această piață? Dacă există o certificare sau un audit independent, vă rog să indicați organizația, domeniul și valabilitatea.",
      qWoman: "Puteți furniza informații specifice produsului privind ambalajul sau materialele care intră în contact cu alimentele, inclusiv materialul și orice declarație disponibilă privind BPA/bisfenoli, ftalați, PFAS, acoperiri sau alte substanțe relevante?",
      qGeneric: "Puteți furniza documentația care se aplică în mod specific acestui produs, indicând domeniul exact, piața și valabilitatea?",
      docs: "Dacă este disponibil, vă rog să atașați sau să indicați linkul către documentul, certificatul sau registrul public justificativ.",
      closing: "Vă mulțumesc."
    },
    tr: {
      title: "Şirkete sor",
      copy: "BOTIA bu ürün için yeterli kamuya açık kanıt bulamadı. Şirkete doğrudan sorabilirsiniz.",
      button: "Şirkete yaz",
      followup: "Şirket size belge gönderirse BOTIA ile iletişime geçin ve bize iletin. Kanıt olarak eklemeden önce inceleyeceğiz.",
      reply_title: "Marka size yanıt verirse",
      reply_body: "Yanıtı botia.traceability@botia-safefood.com adresine iletebilirsiniz. İnceleyeceğiz ve doğrulanabiliyorsa markayı kaynak olarak göstererek kanıt olarak ekleyeceğiz.",
      reply_privacy: "E-posta adresiniz yalnızca bu gönderim hakkında size yanıt vermek için kullanılır. Kanıt, gönderen kişiyi tanımlamadan yayımlanır.",
      subject: "Bir ürün hakkında doğrulanabilir bilgi talebi",
      greeting: "Merhaba,",
      intro: "Aşağıdaki ürün hakkında doğrulanabilir bilgi talep etmek için iletişime geçiyorum:",
      product: "Ürün", brand: "Marka", market: "Pazar", ingredient: "İçerik / açıklığa kavuşturulacak nokta",
      qHalal: "Bu ürünün tam olarak güncel ve geçerli bir helal sertifikası kapsamında olup olmadığını teyit edebilir misiniz? Öyleyse sertifikasyon kuruluşunu, sertifika numarasını, kapsamı, pazarı ve geçerlilik tarihlerini paylaşmanızı rica ederim.",
      qAnimal: "Bu ürün veya bu marka için bu pazarda geçerli olan hayvan testi / cruelty-free durumunu teyit edebilir misiniz? Bağımsız bir sertifika veya denetim varsa kuruluşu, kapsamı ve geçerliliği belirtmenizi rica ederim.",
      qWoman: "Bu ürüne özel ambalaj veya gıda ile temas eden malzemeler hakkında; malzeme türü ve BPA/bisfenoller, ftalatlar, PFAS, kaplamalar ya da diğer ilgili maddelere ilişkin mevcut beyanlar dâhil bilgi verebilir misiniz?",
      qGeneric: "Bu ürüne özel olarak uygulanan belgeleri, tam kapsamı, pazarı ve geçerliliği belirterek sağlayabilir misiniz?",
      docs: "Varsa destekleyici belgeyi, sertifikayı veya kamu kaydını eklemenizi ya da bağlantısını paylaşmanızı rica ederim.",
      closing: "Teşekkür ederim."
    },
    zh: {
      title: "向公司询问",
      copy: "BOTIA 尚未找到足够的公开证据来支持该产品。你可以直接向公司询问。",
      button: "写信给公司",
      followup: "如果公司向你提供文件，请联系 BOTIA 并发送给我们。我们会先审核，再决定是否纳入证据。",
      reply_title: "如果品牌回复你",
      reply_body: "你可以将其回复转发至 botia.traceability@botia-safefood.com。我们会进行审核；如果内容可核实，我们会将其作为证据纳入，并注明品牌为来源。",
      reply_privacy: "你的电子邮箱地址仅用于就该次提交与你联系。证据发布时不会识别提交者的身份。",
      subject: "关于产品可核实信息的请求",
      greeting: "您好：",
      intro: "我联系贵公司，希望获得以下产品的可核实信息：",
      product: "产品", brand: "品牌", market: "市场", ingredient: "成分 / 待澄清事项",
      qHalal: "请确认该具体产品目前是否在有效的清真认证范围内。如是，请提供认证机构、证书编号、适用范围、市场和有效期。",
      qAnimal: "请确认该具体产品或品牌在此市场适用的动物试验 / 零残忍状态。如有独立认证或审核，请提供机构名称、适用范围和有效期。",
      qWoman: "请提供该具体产品包装或食品接触材料的信息，包括材料种类，以及关于 BPA/双酚类、邻苯二甲酸酯、PFAS、涂层或其他相关物质的任何现有声明。",
      qGeneric: "请提供专门适用于该产品的文件，并注明准确的适用范围、市场和有效期。",
      docs: "如有支持文件、证书或公开记录，请附上或提供链接。",
      closing: "谢谢。"
    },
    ru: {
      title: "Спросить компанию",
      copy: "BOTIA не нашла достаточных общедоступных подтверждений для этого продукта. Вы можете напрямую обратиться к компании.",
      button: "Написать компании",
      followup: "Если компания пришлёт вам документы, свяжитесь с BOTIA и передайте их нам. Мы проверим их, прежде чем добавить как доказательство.",
      reply_title: "Если бренд вам ответит",
      reply_body: "Вы можете переслать нам ответ на botia.traceability@botia-safefood.com. Мы проверим его и, если информация поддаётся проверке, добавим её как доказательство, указав бренд в качестве источника.",
      reply_privacy: "Ваш адрес электронной почты используется только для ответа вам по поводу этой отправки. Доказательство публикуется без указания личности человека, который его прислал.",
      subject: "Запрос проверяемой информации о продукте",
      greeting: "Здравствуйте,",
      intro: "Обращаюсь к вам с просьбой предоставить проверяемую информацию о следующем продукте:",
      product: "Продукт", brand: "Бренд", market: "Рынок", ingredient: "Ингредиент / вопрос для уточнения",
      qHalal: "Можете ли вы подтвердить, распространяется ли на этот конкретный продукт действующий сертификат халяль? Если да, укажите орган сертификации, номер сертификата, охват, рынок и сроки действия.",
      qAnimal: "Можете ли вы подтвердить статус в отношении испытаний на животных / cruelty-free, применимый к этому конкретному продукту или бренду на данном рынке? Если имеется независимая сертификация или аудит, укажите организацию, охват и срок действия.",
      qWoman: "Можете ли вы предоставить информацию, относящуюся именно к этому продукту, об упаковке или материалах, контактирующих с пищей, включая материал и доступные заявления о BPA/бисфенолах, фталатах, PFAS, покрытиях или других соответствующих веществах?",
      qGeneric: "Можете ли вы предоставить документацию, применимую именно к этому продукту, с указанием точного охвата, рынка и срока действия?",
      docs: "Если возможно, приложите или укажите ссылку на подтверждающий документ, сертификат или общедоступную запись.",
      closing: "Спасибо."
    }
  };

  const labels = I18N[lang] || I18N.en;
  const clean = value => String(value ?? "").trim();
  const sourceModule = () => {
    const direct = clean(params.get("source"));
    if (direct) return direct;
    const s = window.BotiaSession && typeof window.BotiaSession === "object"
      ? window.BotiaSession : {};
    return clean(s.sourceModule || s.source_module || s.returnContext?.sourceModule);
  };

  const safeJson = raw => {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) {}
    try {
      let b64 = String(raw).replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch (_) { return null; }
  };

  const sessionStoragePayload = () => {
    const id = params.get("session");
    if (!id) return null;
    try { return safeJson(sessionStorage.getItem(`botia.traceability.${id}`)); }
    catch (_) { return null; }
  };

  const queryFallback = () => ({
    query: { gtin: params.get("gtin") || "", market: params.get("market") || "" },
    product: { name: params.get("product") || "", brand: params.get("brand") || "" },
    records: []
  });

  const currentPayload = event => {
    if (event?.detail && typeof event.detail === "object") return event.detail;
    if (window.BOTIA_TRACEABILITY_DATA && typeof window.BOTIA_TRACEABILITY_DATA === "object") {
      return window.BOTIA_TRACEABILITY_DATA;
    }
    return sessionStoragePayload() || safeJson(params.get("payload")) || queryFallback();
  };

  const appSession = () =>
    window.BotiaSession && typeof window.BotiaSession === "object" ? window.BotiaSession : {};

  const readPath = (object, path) => {
    let value = object;
    for (const key of path) {
      if (!value || typeof value !== "object") return "";
      value = value[key];
    }
    return clean(value);
  };

  const firstValue = (object, paths) => {
    for (const path of paths) {
      const value = readPath(object, path);
      if (value) return value;
    }
    return "";
  };

  const contextFrom = payload => {
    const session = appSession();
    return {
      product: firstValue(session, [["productName"],["product_name"],["product","name"],["name"]]) ||
        clean(payload?.product?.name || payload?.product_name || params.get("product")),
      brand: firstValue(session, [["brand"],["product","brand"],["brandName"],["brand_name"]]) ||
        clean(payload?.product?.brand || params.get("brand")),
      gtin: firstValue(session, [["gtin"],["barcode"],["ean"],["product","gtin"],["product","barcode"]]) ||
        clean(payload?.query?.gtin || payload?.gtin || params.get("gtin")),
      market: firstValue(session, [["market"],["targetMarket"],["target_market"],["product","market"]]) ||
        clean(payload?.query?.market || payload?.market || params.get("market")),
      ingredient: firstValue(session, [["ambiguousIngredient"],["ambiguous_ingredient"],["ingredient"],["trigger"],["analysis","trigger"],["analysis","ingredient"]]),
      to: firstValue(session, [["manufacturerEmail"],["manufacturer_email"],["companyEmail"],["company_email"],["contactEmail"],["contact_email"],["product","manufacturerEmail"],["product","manufacturer_email"]])
    };
  };

  const POSITIVE = new Set(["VERIFIED_PRODUCT","VERIFIED_SCOPE","SELF_DECLARED","SOURCE_CLASSIFICATION"]);

  const hasRelevantEvidence = payload => {
    const records = Array.isArray(payload?.records) ? payload.records : [];
    const module = sourceModule();

    if (module === "mashbooh") {
      return records.some(r => r?.domain === "halal" && POSITIVE.has(clean(r?.status)));
    }
    if (module === "animal_origin") {
      return records.some(r => r?.domain === "animal" && POSITIVE.has(clean(r?.status)));
    }
    if (module === "woman_safefood") {
      return records.some(r => ["packaging","other"].includes(r?.domain) && POSITIVE.has(clean(r?.status)));
    }
    return records.some(r => r?.domain !== "identity" && POSITIVE.has(clean(r?.status)));
  };

  const shouldShow = payload =>
    clean(payload?.overall_status) === "NOT_VERIFIED" || !hasRelevantEvidence(payload);

  const questionFor = () => {
    const module = sourceModule();
    if (module === "mashbooh") return labels.qHalal;
    if (module === "animal_origin") return labels.qAnimal;
    if (module === "woman_safefood") return labels.qWoman;
    return labels.qGeneric;
  };

  const buildEmail = payload => {
    const ctx = contextFrom(payload);
    const details = [];
    if (ctx.product) details.push(`${labels.product}: ${ctx.product}`);
    if (ctx.brand) details.push(`${labels.brand}: ${ctx.brand}`);
    if (ctx.gtin) details.push(`GTIN: ${ctx.gtin}`);
    if (ctx.market) details.push(`${labels.market}: ${ctx.market}`);
    if (ctx.ingredient) details.push(`${labels.ingredient}: ${ctx.ingredient}`);

    return {
      to: ctx.to,
      subject: labels.subject,
      body: [
        labels.greeting, "", labels.intro,
        ...details,
        "", questionFor(), "", labels.docs, "", labels.closing
      ].join("\n")
    };
  };

  const requestEmail = detail => {
    if (window.BotiaBarcodeBridge &&
        typeof window.BotiaBarcodeBridge.requestManufacturerEmail === "function") {
      window.BotiaBarcodeBridge.requestManufacturerEmail(detail);
      return;
    }
    document.dispatchEvent(new CustomEvent("botia:request-manufacturer-email", { detail }));
  };

  const injectStyle = () => {
    if (document.getElementById("botia-manufacturer-email-style")) return;
    const style = document.createElement("style");
    style.id = "botia-manufacturer-email-style";
    style.textContent = `
      #botia-manufacturer-request{margin-top:24px;padding:18px;background:linear-gradient(180deg,rgba(36,16,16,.98),rgba(24,13,13,.98));border:1px solid rgba(230,160,107,.4);border-radius:17px;box-shadow:0 18px 60px rgba(0,0,0,.24)}
      #botia-manufacturer-request .bmr-title{color:#ffd8bd;font-size:1rem;font-weight:800;margin:0 0 9px}
      #botia-manufacturer-request .bmr-copy,#botia-manufacturer-request .bmr-followup{color:#c9b3a6;font-size:.88rem;line-height:1.55;margin:0}
      #botia-manufacturer-request .bmr-action{width:100%;display:block;margin:15px 0 12px;appearance:none;border:1px solid rgba(230,160,107,.62);border-radius:12px;background:rgba(190,122,72,.14);color:#ffd8bd;padding:13px 16px;font:inherit;font-size:.92rem;font-weight:800;text-align:center;cursor:pointer}
      #botia-manufacturer-request .bmr-action:focus-visible{outline:2px solid #ffd8bd;outline-offset:3px}
      #botia-manufacturer-request .bmr-followup{font-size:.8rem;color:#b99a88}
      #botia-manufacturer-request .bmr-reply-title{font-weight:800;color:#ffd8bd;margin:0 0 7px}
      #botia-manufacturer-request .bmr-reply-body{margin:0 0 8px;line-height:1.55}
      #botia-manufacturer-request .bmr-reply-privacy{margin:0;line-height:1.55}
    `;
    document.head.appendChild(style);
  };

  const render = payload => {
    document.getElementById("botia-manufacturer-request")?.remove();
    if (!shouldShow(payload)) return;

    const anchor = document.getElementById("principle");
    if (!anchor) return;
    injectStyle();

    const section = document.createElement("section");
    section.id = "botia-manufacturer-request";
    section.setAttribute("aria-labelledby", "botia-manufacturer-request-title");

    const title = document.createElement("h2");
    title.id = "botia-manufacturer-request-title";
    title.className = "bmr-title";
    title.textContent = labels.title;

    const copy = document.createElement("p");
    copy.className = "bmr-copy";
    copy.textContent = labels.copy;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "bmr-action";
    button.textContent = labels.button;
    button.addEventListener("click", () => requestEmail(buildEmail(payload)));

    const followup = document.createElement("div");
    followup.className = "bmr-followup";

    const replyTitle = document.createElement("div");
    replyTitle.className = "bmr-reply-title";
    replyTitle.textContent = labels.reply_title;

    const replyBody = document.createElement("p");
    replyBody.className = "bmr-reply-body";
    replyBody.textContent = labels.reply_body;

    const replyPrivacy = document.createElement("p");
    replyPrivacy.className = "bmr-reply-privacy";
    replyPrivacy.textContent = labels.reply_privacy;

    followup.append(replyTitle, replyBody, replyPrivacy);

    section.append(title, copy, button, followup);
    anchor.insertAdjacentElement("beforebegin", section);
  };

  const renderEvent = event => render(currentPayload(event));
  const init = () => render(currentPayload());

  document.addEventListener("botia:traceability-ready", renderEvent);
  document.addEventListener("botia:traceability-updated", renderEvent);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
