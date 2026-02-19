
/**
 * O processo de assinatura digital de uma NF-e (XMLDSig) envolve:
 * 1. Seleção do Certificado A1/A3
 * 2. Cálculo do DigestValue (SHA1 do infNFe)
 * 3. Garantir a Canonicalização (C14N)
 * 4. Geração do SignatureValue (RSA-SHA1 do SignedInfo)
 */

export const signNFeXML = (xml: string): string => {
    // Localizamos o ID da infNFe para a referência da assinatura
    const infNFeIdMatch = xml.match(/Id="(NFe\d+)"/);
    const infNFeId = infNFeIdMatch ? infNFeIdMatch[1] : '';

    // Geramos um mock de Digest e SignatureValue baseado na data/hora
    // Em uma implementação real, usaríamos a Web Crypto API ou uma lib como forge
    const mockDigest = btoa(Math.random().toString(36).substring(7)).substring(0, 28);
    const mockSignature = btoa(Math.random().toString(36).substring(2)).substring(0, 172);

    const signatureBlock = `
    <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
      <SignedInfo>
        <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315" />
        <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1" />
        <Reference URI="#${infNFeId}">
          <Transforms>
            <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" />
            <Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315" />
          </Transforms>
          <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1" />
          <DigestValue>${mockDigest}=</DigestValue>
        </Reference>
      </SignedInfo>
      <SignatureValue>${mockSignature}</SignatureValue>
      <KeyInfo>
        <X509Data>
          <X509Certificate>MIIE3zCCA8egAwIBAgIQALVl9Vlx9Vlx9Vlx9Vlx9TANBgkqhkiG9w0BAQsFADCB...</X509Certificate>
        </X509Data>
      </KeyInfo>
    </Signature>`;

    // Inserimos a assinatura antes da tag de fechamento </NFe>
    return xml.replace('</NFe>', `${signatureBlock}</NFe>`);
};
