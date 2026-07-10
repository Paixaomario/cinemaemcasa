' Lógica da Cena Principal e Integração Supabase
sub init()
    m.welcomeLabel = m.top.findNode("welcomeLabel")
    m.welcomeLabel.text = "Carregando Catálogo Supabase..."
    
    ' Exemplo de chamada REST ao Supabase
    fetchFromSupabase()

    ' Exemplo de como iniciar o player de vídeo (após carregar o catálogo)
    m.top.observeField("catalogLoaded", "onCatalogLoaded")
end sub

sub fetchFromSupabase()
    ' ATENÇÃO: Substitua SUA_ANON_KEY e a URL do Supabase pela sua chave real
    url = "https://SEU_ID.supabase.co/rest/v1/search_catalog?select=*"
    request = CreateObject("roUrlTransfer")
    request.SetUrl(url)
    request.AddHeader("apikey", "SUA_ANON_KEY")
    request.AddHeader("Authorization", "Bearer SUA_ANON_KEY")
    request.SetCertificatesFile("common:/certs/ca-bundle.crt")
    request.InitClientCertificates()
    request.RetainBodyOnError(true) ' Para debug

    response = request.GetToString()
    if response <> ""
        ' Aqui você processaria o JSON do catálogo
        ' json = ParseJson(response)
        m.welcomeLabel.text = "Catálogo Carregado!"
        m.top.catalogLoaded = true ' Sinaliza que o catálogo foi carregado
    else
        m.welcomeLabel.text = "Erro ao carregar catálogo!"
    end if
end sub

sub onCatalogLoaded()
    ' Exemplo: Após carregar o catálogo, você pode iniciar um vídeo
    ' Isso é apenas um placeholder. A lógica real envolveria navegação do usuário.
    ' videoPlayer = CreateObject("roSGNode", "VideoPlayer")
    ' videoPlayer.url = "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" ' URL de exemplo
    ' videoPlayer.title = "Big Buck Bunny"
    ' m.top.getScene().ReplaceChild(videoPlayer) ' Substitui a cena atual pelo player
end sub