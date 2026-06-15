' Lógica do Player Roku
sub init()
    m.top.notificationInterval = 1
    m.top.observeField("state", "onPlayerStateChange")
end sub

sub onPlayerStateChange()
    state = m.top.state
    if state = "finished"
        ' Lógica para próximo episódio ou fechar player
        m.top.getScene().exitVideo = true
    else if state = "error"
        print "Erro no Playback Roku: "; m.top.errorCode; " - "; m.top.errorMsg
    end if
end sub