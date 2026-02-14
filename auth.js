<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="config.js"></script>
<script src="auth.js"></script>
<script>
    document.addEventListener('DOMContentLoaded', function() {
        console.log('✅ Auth disponible:', !!window.Auth);
        
        document.getElementById('signupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const message = document.getElementById('message');
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscription...';
            message.style.display = 'none';

            try {
                const result = await Auth.signUp({
                    fullname: document.getElementById('fullname').value,
                    email: document.getElementById('email').value,
                    password: document.getElementById('password').value,
                    phone: document.getElementById('countryCode').value + 
                           document.getElementById('phone').value.replace(/\s/g, ''),
                    country: document.getElementById('country').value,
                    city: document.getElementById('city').value,
                    username: document.getElementById('username').value,
                    newsletter: document.getElementById('newsletter').checked
                });

                if (result.success) {
                    message.className = 'message success';
                    message.innerHTML = '✅ Inscription réussie !';
                    message.style.display = 'block';
                    
                    setTimeout(() => {
                        window.location.href = 'connexion.html';
                    }, 2000);
                } else {
                    throw new Error(result.error);
                }

            } catch (error) {
                message.className = 'message error';
                message.innerHTML = '❌ ' + error.message;
                message.style.display = 'block';
                
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> S\'inscrire';
            }
        });
    });
</script>