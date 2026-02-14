fetch('/html/navbar.html')
    .then(function(respuesta) { return respuesta.text(); })
    .then(function(htmlNavbar) {
        document.getElementById('navbar-placeholder').innerHTML = htmlNavbar;
    });

fetch('/html/producto-tarjeta.html')
    .then(function(respuesta) { return respuesta.text(); })
    .then(function(plantillaTarjeta) {
        let categoriaURL = window.location.pathname.split('/')[1];
        let urlAPI = '/api/productos';
        
        if (categoriaURL && categoriaURL !== 'search') {
            urlAPI = urlAPI + '?categoria=' + categoriaURL;
        }

        const parametrosURL = new URLSearchParams(window.location.search);
        const consultaBusqueda = parametrosURL.get('q');
        
        if (consultaBusqueda) {
            urlAPI = urlAPI + (urlAPI.includes('?') ? '&' : '?') + 'q=' + encodeURIComponent(consultaBusqueda);
        }

        fetch(urlAPI)
            .then(function(respuesta) { return respuesta.json(); })
            .then(function(listaProductos) {
                let contenedor = document.getElementById('productos-container');
                let htmlFinal = '';

                for (let i = 0; i < listaProductos.length; i++) {
                    let producto = listaProductos[i];
                    let tarjeta = plantillaTarjeta;

                    tarjeta = tarjeta.replace('{{id}}', producto.id);
                    tarjeta = tarjeta.replace('{{image}}', producto.images[0] || '/assets/icon.png');
                    tarjeta = tarjeta.split('{{name}}').join(producto.name);
                    tarjeta = tarjeta.replace('{{brand}}', producto.brand || '');
                    tarjeta = tarjeta.replace('{{price}}', producto.price);
                    
                    let cuota = (producto.price / 6).toFixed(2);
                    tarjeta = tarjeta.replace('{{cuota}}', cuota);
                    htmlFinal = htmlFinal + tarjeta;
                }
                contenedor.innerHTML = htmlFinal;
            });
    });
