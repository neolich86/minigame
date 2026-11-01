package kr.minigame.auth;

import android.os.CancellationSignal;
import androidx.annotation.NonNull;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;
import java.util.concurrent.Executors;

/**
 * 구글 로그인 (안드로이드 Credential Manager).
 * 구글은 웹뷰 안의 로그인 창을 막기 때문에, 웹 화면이 window.Capacitor.Plugins.GoogleSignIn.signIn({ webClientId, nonce }) 를 부르면
 * 휴대폰의 구글 계정 선택 창을 띄우고 ID 토큰을 돌려준다. 웹은 그 토큰으로 Supabase signInWithIdToken 을 한다.
 * webClientId 는 구글 클라우드의 '웹 애플리케이션' 클라이언트 ID (안드로이드 클라이언트는 패키지명·SHA-1 확인용으로만 등록).
 */
@CapacitorPlugin(name = "GoogleSignIn")
public class GoogleSignInPlugin extends Plugin {

    @PluginMethod
    public void signIn(final PluginCall call) {
        String clientId = call.getString("webClientId");
        if (clientId == null || clientId.isEmpty()) {
            call.reject("missing_client_id");
            return;
        }
        GetSignInWithGoogleOption.Builder option = new GetSignInWithGoogleOption.Builder(clientId);
        String nonce = call.getString("nonce");
        if (nonce != null && !nonce.isEmpty()) option.setNonce(nonce);
        GetCredentialRequest request = new GetCredentialRequest.Builder().addCredentialOption(option.build()).build();
        CredentialManager manager = CredentialManager.create(getContext());
        manager.getCredentialAsync(
            getActivity(),
            request,
            new CancellationSignal(),
            Executors.newSingleThreadExecutor(),
            new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                @Override
                public void onResult(GetCredentialResponse response) {
                    Credential credential = response.getCredential();
                    if (credential instanceof CustomCredential
                        && GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType())) {
                        try {
                            GoogleIdTokenCredential google = GoogleIdTokenCredential.createFrom(((CustomCredential) credential).getData());
                            JSObject out = new JSObject();
                            out.put("idToken", google.getIdToken());
                            out.put("email", google.getId());
                            out.put("name", google.getDisplayName());
                            call.resolve(out);
                        } catch (Exception e) {
                            call.reject("bad_credential: " + e.getMessage());
                        }
                    } else {
                        call.reject("unexpected_credential");
                    }
                }

                @Override
                public void onError(@NonNull GetCredentialException e) {
                    if (e instanceof GetCredentialCancellationException) call.reject("canceled");
                    else call.reject(e.getClass().getSimpleName() + ": " + e.getMessage());
                }
            }
        );
    }
}
