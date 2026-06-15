' Lógica da Cena Principal e Integração Supabase
sub init()
    m.welcomeLabel = m.top.findNode("welcomeLabel")
    m.welcomeLabel.text = "Carregando Catálogo..."
    
    ' Exemplo de chamada REST ao Supabase
    fetchFromSupabase()
end sub

sub fetchFromSupabase()
    url = "https://SEU_ID.supabase.co/rest/v1/search_catalog?select=*"
    request = CreateObject("roUrlTransfer")
    request.SetUrl(url)
    request.AddHeader("apikey", "SUA_ANON_KEY")
    request.AddHeader("Authorization", "Bearer SUA_ANON_KEY")
    request.SetCertificatesFile("common:/certs/ca-bundle.crt")
    request.InitClientCertificates()

    response = request.GetToString()
    if response <> ""
        ' json = ParseJson(response)
        m.welcomeLabel.text = "Cinema em Casa Disponível"
    end if
end sub