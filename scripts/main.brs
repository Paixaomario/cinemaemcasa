' Entry point para o aplicativo Roku
sub Main()
    screen = CreateObject("roSGScreen")
    m.port = CreateObject("roMessagePort")
    screen.SetMessagePort(m.port)

    scene = screen.CreateScene("MainScene")
    screen.show()

    while(true)
        msg = wait(0, m.port)
        if type(msg) = "roSGScreenEvent" if msg.isScreenClosed() return
    end while
end sub